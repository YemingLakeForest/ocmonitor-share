"""REST API for OpenCode Monitor web dashboard."""

import json
import time
from decimal import Decimal
from datetime import datetime
from typing import Any, Dict, List, Optional

from flask import Blueprint, jsonify, request

from ..config import config_manager
from ..services.session_analyzer import SessionAnalyzer
from ..services.report_generator import ReportGenerator
from ..services.session_grouper import SessionGrouper
from ..services.live_monitor import LiveMonitor
from ..models.session import SessionData, TokenUsage

api = Blueprint("api", __name__, url_prefix="/api")

# Module-level references set by server.py at startup
_analyzer: Optional[SessionAnalyzer] = None
_report_generator: Optional[ReportGenerator] = None
_pricing_data: Optional[dict] = None
_live_monitor: Optional[LiveMonitor] = None


def init_api(analyzer: SessionAnalyzer, report_generator: ReportGenerator, pricing_data: dict,
             live_monitor: Optional[LiveMonitor] = None):
    """Initialize API with shared service instances."""
    global _analyzer, _report_generator, _pricing_data, _live_monitor
    _analyzer = analyzer
    _report_generator = report_generator
    _pricing_data = pricing_data
    _live_monitor = live_monitor


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal and datetime types."""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        return super().default(obj)


def _json_response(data: Any, status: int = 200):
    """Create a JSON response with proper encoding."""
    response = json.dumps(data, cls=DecimalEncoder)
    return response, status, {"Content-Type": "application/json"}


# ── Summary / Dashboard Overview ──────────────────────────────────────

@api.route("/summary")
def summary():
    """Get overall summary statistics for the dashboard overview."""
    try:
        sessions = _analyzer.analyze_all_sessions()
        if not sessions:
            return _json_response({"summary": None, "sessions": []})

        summary_data = _analyzer.get_sessions_summary(sessions)
        result = _report_generator._format_sessions_summary_json(sessions, summary_data)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Sessions ──────────────────────────────────────────────────────────

@api.route("/sessions")
def sessions_list():
    """Get all sessions with optional limit."""
    try:
        limit = request.args.get("limit", type=int, default=None)
        sessions = _analyzer.analyze_all_sessions(limit=limit)
        if not sessions:
            return _json_response({"summary": None, "sessions": []})

        summary_data = _analyzer.get_sessions_summary(sessions)
        result = _report_generator._format_sessions_summary_json(sessions, summary_data)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


@api.route("/sessions/<session_id>")
def session_detail(session_id: str):
    """Get detailed information for a single session."""
    try:
        # Load all sessions and find the one with matching ID
        sessions = _analyzer.analyze_all_sessions()
        session = next((s for s in sessions if s.session_id == session_id), None)

        if not session:
            return _json_response({"error": "Session not found"}, 404)

        stats = _analyzer.get_session_statistics(session)
        health = _analyzer.validate_session_health(session)
        result = _report_generator._format_single_session_json(session, stats, health)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Daily Breakdown ───────────────────────────────────────────────────

@api.route("/daily")
def daily_breakdown():
    """Get daily usage breakdown."""
    try:
        month = request.args.get("month")
        sessions = _analyzer.analyze_all_sessions()
        if not sessions:
            return _json_response({"daily_breakdown": []})

        daily_usage = _analyzer.create_daily_breakdown(sessions)

        # Filter by month if specified
        if month:
            try:
                year_val, month_val = month.split("-")
                daily_usage = [
                    d for d in daily_usage
                    if d.date.year == int(year_val) and d.date.month == int(month_val)
                ]
            except ValueError:
                return _json_response({"error": "Invalid month format. Use YYYY-MM"}, 400)

        result = _report_generator._format_daily_breakdown_json(daily_usage)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Weekly Breakdown ──────────────────────────────────────────────────

@api.route("/weekly")
def weekly_breakdown():
    """Get weekly usage breakdown."""
    try:
        year = request.args.get("year", type=int)
        start_day = request.args.get("start_day", "monday").lower()

        from ..utils.time_utils import WEEKDAY_MAP
        week_start_day = WEEKDAY_MAP.get(start_day, 0)

        sessions = _analyzer.analyze_all_sessions()
        if not sessions:
            return _json_response({"weekly_breakdown": []})

        daily_usage = _analyzer.create_daily_breakdown(sessions)
        weekly_usage = _analyzer.create_weekly_breakdown(sessions, week_start_day)

        if year:
            weekly_usage = [w for w in weekly_usage if w.year == year]

        result = _report_generator._format_weekly_breakdown_json(weekly_usage)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Monthly Breakdown ─────────────────────────────────────────────────

@api.route("/monthly")
def monthly_breakdown():
    """Get monthly usage breakdown."""
    try:
        year = request.args.get("year", type=int)

        sessions = _analyzer.analyze_all_sessions()
        if not sessions:
            return _json_response({"monthly_breakdown": []})

        daily_usage = _analyzer.create_daily_breakdown(sessions)
        weekly_usage = _analyzer.create_weekly_breakdown(sessions)
        monthly_usage = _analyzer.create_monthly_breakdown(sessions)

        if year:
            monthly_usage = [m for m in monthly_usage if m.year == year]

        result = _report_generator._format_monthly_breakdown_json(monthly_usage)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Models ────────────────────────────────────────────────────────────

@api.route("/models")
def models_breakdown():
    """Get model usage statistics."""
    try:
        timeframe = request.args.get("timeframe", "all")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        sessions = _analyzer.analyze_all_sessions()
        if not sessions:
            return _json_response({"models": [], "total_cost": 0, "total_tokens": {}})

        model_breakdown = _analyzer.create_model_breakdown(
            sessions, timeframe, start_date, end_date
        )
        result = _report_generator._format_models_breakdown_json(model_breakdown)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Projects ──────────────────────────────────────────────────────────

@api.route("/projects")
def projects_breakdown():
    """Get project usage statistics."""
    try:
        timeframe = request.args.get("timeframe", "all")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        sessions = _analyzer.analyze_all_sessions()
        if not sessions:
            return _json_response({"projects": [], "total_cost": 0, "total_tokens": {}})

        project_breakdown = _analyzer.create_project_breakdown(
            sessions, timeframe, start_date, end_date
        )
        result = _report_generator._format_projects_breakdown_json(project_breakdown)
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Config / Pricing ─────────────────────────────────────────────────

@api.route("/config")
def config_info():
    """Get current configuration."""
    try:
        cfg = config_manager.config
        return _json_response({
            "paths": {
                "messages_dir": cfg.paths.messages_dir,
                "database_file": cfg.paths.database_file,
                "export_dir": cfg.paths.export_dir,
            },
            "ui": {
                "theme": cfg.ui.theme,
                "table_style": cfg.ui.table_style,
                "live_refresh_interval": cfg.ui.live_refresh_interval,
            },
            "models_count": len(_pricing_data) if _pricing_data else 0,
            "data_source": _analyzer.get_data_source_info() if _analyzer else None,
        })
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


@api.route("/pricing")
def pricing_info():
    """Get model pricing data."""
    try:
        if not _pricing_data:
            return _json_response({"models": {}})

        result = {}
        for name, pricing in _pricing_data.items():
            result[name] = {
                "input": float(pricing.input),
                "output": float(pricing.output),
                "cache_write": float(pricing.cache_write),
                "cache_read": float(pricing.cache_read),
                "context_window": pricing.context_window,
                "session_quota": float(pricing.session_quota),
            }
        return _json_response({"models": result})
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


# ── Live Monitoring ───────────────────────────────────────────────────

def _serialize_session(session: SessionData) -> Dict[str, Any]:
    """Serialize a SessionData for the live API response."""
    cost = float(session.calculate_total_cost(_pricing_data))
    breakdown = session.get_model_breakdown(_pricing_data)

    models = []
    for model_id, stats in breakdown.items():
        # Compute p50 output rate for this model
        rates = stats.get("interaction_rates", [])
        p50 = 0.0
        if rates:
            sorted_rates = sorted(rates)
            mid = len(sorted_rates) // 2
            p50 = sorted_rates[mid] if len(sorted_rates) % 2 == 1 else (sorted_rates[mid - 1] + sorted_rates[mid]) / 2

        # Context usage from most recent interaction of this model
        context_size = 0
        context_window = 0
        for f in reversed(session.files):
            if f.model_id == model_id and f.tokens.total > 0:
                context_size = f.tokens.input + f.tokens.cache_read + f.tokens.cache_write
                pricing = _pricing_data.get(model_id)
                context_window = pricing.context_window if pricing else 200000
                break

        models.append({
            "model_id": model_id,
            "interactions": stats["files"],
            "tokens": stats["tokens"].model_dump(),
            "cost": float(stats["cost"]),
            "duration_ms": stats.get("duration_ms", 0),
            "p50_output_rate": round(p50, 1),
            "context_size": context_size,
            "context_window": context_window,
            "context_pct": round((context_size / context_window * 100), 1) if context_window > 0 else 0,
        })

    # Session quota from primary model
    quota = 0.0
    if session.models_used and _pricing_data:
        primary_model = session.models_used[0]
        pricing = _pricing_data.get(primary_model)
        if pricing:
            quota = float(pricing.session_quota)

    return {
        "session_id": session.session_id,
        "session_title": session.session_title,
        "project_name": session.project_name,
        "agent": session.agent,
        "is_sub_agent": session.is_sub_agent,
        "interaction_count": session.interaction_count,
        "tokens": session.total_tokens.model_dump(),
        "cost": cost,
        "quota": quota,
        "quota_pct": round((cost / quota * 100), 1) if quota > 0 else 0,
        "models_used": session.models_used,
        "model_breakdown": models,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "end_time": session.end_time.isoformat() if session.end_time else None,
        "duration_ms": session.duration_ms,
        "duration_hours": round(session.duration_hours, 2),
        "duration_pct": round(session.duration_percentage, 1),
    }


def _serialize_recent_interaction(session: SessionData) -> Optional[Dict[str, Any]]:
    """Get the most recent non-zero interaction from a session."""
    for f in reversed(session.files):
        if f.tokens.total > 0:
            return {
                "model_id": f.model_id,
                "tokens": f.tokens.model_dump(),
                "cost": float(f.calculate_cost(_pricing_data)),
                "duration_ms": f.time_data.duration_ms if f.time_data else None,
                "agent": f.agent,
            }
    return None


def _build_workflow_response(workflow_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Build a full live workflow response from a SQLite workflow dict."""
    main_session = workflow_dict["main_session"]
    sub_agents = workflow_dict.get("sub_agents", [])
    all_sessions = workflow_dict.get("all_sessions", [main_session] + sub_agents)

    # Aggregate tokens
    total_tokens = TokenUsage()
    total_cost = Decimal("0.0")
    for s in all_sessions:
        total_tokens = TokenUsage(
            input=total_tokens.input + s.total_tokens.input,
            output=total_tokens.output + s.total_tokens.output,
            cache_write=total_tokens.cache_write + s.total_tokens.cache_write,
            cache_read=total_tokens.cache_read + s.total_tokens.cache_read,
        )
        total_cost += s.calculate_total_cost(_pricing_data)

    # Time range
    start_times = [s.start_time for s in all_sessions if s.start_time]
    end_times = [s.end_time for s in all_sessions if s.end_time]
    start_time = min(start_times) if start_times else None
    end_time = max(end_times) if end_times else None

    # Duration
    now = datetime.now()
    if start_time:
        duration_ms = int((now - start_time).total_seconds() * 1000)
        duration_hours = duration_ms / 3600000
        duration_pct = min(duration_hours / 5.0 * 100, 100)
    else:
        duration_ms = 0
        duration_hours = 0
        duration_pct = 0

    # Activity status
    activity_status = "inactive"
    last_activity_ago = None
    for s in all_sessions:
        for f in reversed(s.files):
            if f.time_data and f.time_data.created:
                ts = f.time_data.created / 1000
                ago = time.time() - ts
                if last_activity_ago is None or ago < last_activity_ago:
                    last_activity_ago = ago
                break

    if last_activity_ago is not None:
        if last_activity_ago < 60:
            activity_status = "active"
        elif last_activity_ago < 300:
            activity_status = "recent"
        elif last_activity_ago < 1800:
            activity_status = "idle"

    # Session quota from main session's primary model
    quota = 0.0
    if main_session.models_used and _pricing_data:
        primary_model = main_session.models_used[0]
        pricing = _pricing_data.get(primary_model)
        if pricing:
            quota = float(pricing.session_quota)

    # Most recent interaction across all sessions
    recent_interaction = None
    latest_ts = 0
    for s in all_sessions:
        for f in reversed(s.files):
            if f.tokens.total > 0:
                ts = f.time_data.created if f.time_data and f.time_data.created else 0
                if ts > latest_ts:
                    latest_ts = ts
                    recent_interaction = {
                        "model_id": f.model_id,
                        "tokens": f.tokens.model_dump(),
                        "cost": float(f.calculate_cost(_pricing_data)),
                        "duration_ms": f.time_data.duration_ms if f.time_data else None,
                        "agent": f.agent,
                        "session_id": s.session_id,
                    }
                break

    # Per-model aggregated stats across all sessions
    model_agg: Dict[str, Dict[str, Any]] = {}
    for s in all_sessions:
        breakdown = s.get_model_breakdown(_pricing_data)
        for model_id, stats in breakdown.items():
            if model_id not in model_agg:
                model_agg[model_id] = {
                    "tokens": TokenUsage(),
                    "cost": Decimal("0.0"),
                    "interactions": 0,
                    "rates": [],
                    "context_size": 0,
                    "context_window": 0,
                }
            agg = model_agg[model_id]
            st = stats["tokens"]
            agg["tokens"] = TokenUsage(
                input=agg["tokens"].input + st.input,
                output=agg["tokens"].output + st.output,
                cache_write=agg["tokens"].cache_write + st.cache_write,
                cache_read=agg["tokens"].cache_read + st.cache_read,
            )
            agg["cost"] += stats["cost"]
            agg["interactions"] += stats["files"]
            agg["rates"].extend(stats.get("interaction_rates", []))

    # Context usage per model (from most recent interaction)
    for s in all_sessions:
        for f in reversed(s.files):
            if f.tokens.total > 0 and f.model_id in model_agg:
                agg = model_agg[f.model_id]
                ctx = f.tokens.input + f.tokens.cache_read + f.tokens.cache_write
                if ctx > agg["context_size"]:
                    agg["context_size"] = ctx
                    pricing = _pricing_data.get(f.model_id) if _pricing_data else None
                    agg["context_window"] = pricing.context_window if pricing else 200000

    model_stats = []
    for model_id, agg in model_agg.items():
        rates = sorted(agg["rates"]) if agg["rates"] else []
        p50 = 0.0
        if rates:
            mid = len(rates) // 2
            p50 = rates[mid] if len(rates) % 2 == 1 else (rates[mid - 1] + rates[mid]) / 2
        cw = agg["context_window"]
        model_stats.append({
            "model_id": model_id,
            "interactions": agg["interactions"],
            "tokens": agg["tokens"].model_dump(),
            "cost": float(agg["cost"]),
            "p50_output_rate": round(p50, 1),
            "context_size": agg["context_size"],
            "context_window": cw,
            "context_pct": round((agg["context_size"] / cw * 100), 1) if cw > 0 else 0,
        })
    model_stats.sort(key=lambda x: x["cost"], reverse=True)

    # Tool stats (SQLite only)
    tool_stats = []
    try:
        session_ids = [s.session_id for s in all_sessions]
        from ..utils.data_loader import DataLoader
        loader = DataLoader()
        raw_tool_stats = loader.load_tool_usage(session_ids, preferred_source="sqlite")
        tool_stats = [
            {
                "tool_name": t.tool_name,
                "total_calls": t.total_calls,
                "success_count": t.success_count,
                "failure_count": t.failure_count,
                "success_rate": round(t.success_rate, 1),
            }
            for t in raw_tool_stats
        ]
    except Exception:
        pass

    return {
        "workflow_id": workflow_dict.get("workflow_id", main_session.session_id),
        "display_title": workflow_dict.get("display_title", main_session.display_title),
        "project_name": workflow_dict.get("project_name", main_session.project_name),
        "session_count": workflow_dict.get("session_count", len(all_sessions)),
        "sub_agent_count": workflow_dict.get("sub_agent_count", len(sub_agents)),
        "has_sub_agents": workflow_dict.get("has_sub_agents", len(sub_agents) > 0),
        "activity_status": activity_status,
        "last_activity_ago": round(last_activity_ago, 0) if last_activity_ago is not None else None,
        "tokens": total_tokens.model_dump(),
        "cost": float(total_cost),
        "quota": quota,
        "quota_pct": round((float(total_cost) / quota * 100), 1) if quota > 0 else 0,
        "start_time": start_time.isoformat() if start_time else None,
        "end_time": end_time.isoformat() if end_time else None,
        "duration_ms": duration_ms,
        "duration_hours": round(duration_hours, 2),
        "duration_pct": round(duration_pct, 1),
        "recent_interaction": recent_interaction,
        "model_breakdown": model_stats,
        "tool_stats": tool_stats,
        "sessions": [_serialize_session(s) for s in all_sessions],
    }


@api.route("/live")
def live_workflows():
    """Get all active workflows for live monitoring."""
    try:
        from ..utils.sqlite_utils import SQLiteProcessor
        db_path = SQLiteProcessor.find_database_path()

        if not db_path:
            return _json_response({"workflows": [], "error": "No database found"})

        workflows = SQLiteProcessor.get_all_active_workflows(db_path)

        if not workflows:
            # Fall back to most recent
            most_recent = SQLiteProcessor.get_most_recent_workflow(db_path)
            if most_recent:
                workflows = [most_recent]

        result = {
            "timestamp": datetime.now().isoformat(),
            "workflow_count": len(workflows),
            "workflows": [_build_workflow_response(w) for w in workflows],
        }
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)


@api.route("/live/<workflow_id>")
def live_workflow_detail(workflow_id: str):
    """Get detailed live data for a specific workflow."""
    try:
        from ..utils.sqlite_utils import SQLiteProcessor
        db_path = SQLiteProcessor.find_database_path()

        if not db_path:
            return _json_response({"error": "No database found"}, 404)

        workflows = SQLiteProcessor.get_all_active_workflows(db_path)

        # Also check most recent if not in active list
        if not workflows:
            most_recent = SQLiteProcessor.get_most_recent_workflow(db_path)
            if most_recent:
                workflows = [most_recent]

        target = None
        for w in workflows:
            wid = w.get("workflow_id", w["main_session"].session_id)
            if wid == workflow_id:
                target = w
                break
            # Check if any session in the workflow matches
            all_sessions = w.get("all_sessions", [w["main_session"]] + w.get("sub_agents", []))
            if any(s.session_id == workflow_id for s in all_sessions):
                target = w
                break

        if not target:
            return _json_response({"error": "Workflow not found"}, 404)

        result = _build_workflow_response(target)
        result["timestamp"] = datetime.now().isoformat()
        return _json_response(result)
    except Exception as e:
        return _json_response({"error": str(e)}, 500)
