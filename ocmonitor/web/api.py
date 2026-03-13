"""REST API for OpenCode Monitor web dashboard."""

import json
from decimal import Decimal
from datetime import datetime
from typing import Any, Dict, Optional

from flask import Blueprint, jsonify, request

from ..config import config_manager
from ..services.session_analyzer import SessionAnalyzer
from ..services.report_generator import ReportGenerator
from ..services.session_grouper import SessionGrouper
from ..models.session import SessionData

api = Blueprint("api", __name__, url_prefix="/api")

# Module-level references set by server.py at startup
_analyzer: Optional[SessionAnalyzer] = None
_report_generator: Optional[ReportGenerator] = None
_pricing_data: Optional[dict] = None


def init_api(analyzer: SessionAnalyzer, report_generator: ReportGenerator, pricing_data: dict):
    """Initialize API with shared service instances."""
    global _analyzer, _report_generator, _pricing_data
    _analyzer = analyzer
    _report_generator = report_generator
    _pricing_data = pricing_data


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
