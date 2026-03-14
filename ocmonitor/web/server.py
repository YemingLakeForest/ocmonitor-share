"""Flask web server for OpenCode Monitor dashboard."""

import os
import webbrowser
import threading
from typing import Dict, Optional

from flask import Flask, send_from_directory
from rich.console import Console

from ..config import config_manager, ModelPricing
from ..services.session_analyzer import SessionAnalyzer
from ..services.report_generator import ReportGenerator
from ..services.live_monitor import LiveMonitor
from .api import api, init_api


def create_app(pricing_data: Dict[str, ModelPricing], console: Optional[Console] = None) -> Flask:
    """Create and configure the Flask application.

    Args:
        pricing_data: Model pricing data for cost calculations
        console: Rich console instance (optional)

    Returns:
        Configured Flask application
    """
    # Determine static folder path
    static_dir = os.path.join(os.path.dirname(__file__), "frontend", "build")

    app = Flask(
        __name__,
        static_folder=static_dir,
        static_url_path="",
    )

    # Initialize services
    if console is None:
        console = Console()

    analyzer = SessionAnalyzer(pricing_data)
    report_generator = ReportGenerator(analyzer, console)
    live_monitor = LiveMonitor(pricing_data, console, init_from_db=False)

    # Wire up API
    init_api(analyzer, report_generator, pricing_data, live_monitor)
    app.register_blueprint(api)

    # Serve React app for all non-API routes
    @app.route("/")
    def serve_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.errorhandler(404)
    def not_found(e):
        # For client-side routing, serve index.html for non-API 404s
        if not e or not hasattr(e, 'description'):
            return send_from_directory(app.static_folder, "index.html")
        return send_from_directory(app.static_folder, "index.html")

    return app


def start_server(
    pricing_data: Dict[str, ModelPricing],
    host: str = "127.0.0.1",
    port: int = 8080,
    debug: bool = False,
    no_browser: bool = False,
    console: Optional[Console] = None,
):
    """Start the web server.

    Args:
        pricing_data: Model pricing data
        host: Host to bind to
        port: Port to listen on
        debug: Enable Flask debug mode
        no_browser: Don't auto-open browser
        console: Rich console instance
    """
    if console is None:
        console = Console()

    app = create_app(pricing_data, console)

    url = f"http://{host}:{port}"
    console.print(f"[bold green]OpenCode Monitor Web Dashboard[/bold green]")
    console.print(f"[dim]Server running at:[/dim] [bold cyan]{url}[/bold cyan]")
    console.print(f"[dim]API endpoint:[/dim]     [bold cyan]{url}/api/summary[/bold cyan]")
    console.print(f"[dim]Press Ctrl+C to stop.[/dim]")

    if not no_browser:
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    app.run(host=host, port=port, debug=debug)
