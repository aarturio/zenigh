from textual.app import App, ComposeResult
from textual.widgets import DataTable
import numpy as np
from rich.text import Text


class TableApp(App):
    BINDINGS = [("q", "quit", "Quit")]

    CSS = """
    #indicators {
        margin-top: 1;
    }
    """

    def compose(self) -> ComposeResult:
        yield DataTable(id="market")
        yield DataTable(id="indicators")

    def on_mount(self) -> None:
        # Market data table
        market = self.query_one("#market", DataTable)
        self.col1, self.col2, self.col3, self.col4, self.col5, self.col6, self.col7, self.col8 = (
            market.add_columns("symbol", "open", "high", "low", "close", "change", "volume", "vwap")
        )
        self.row1 = market.add_row("SPY", 650.00)

        # Indicators table
        indicators = self.query_one("#indicators", DataTable)
        self.ind_ema, self.ind_macd, self.ind_signal, self.ind_histogram = (
            indicators.add_columns("EMA 9", "MACD", "Signal", "Histogram")
        )
        self.ind_row = indicators.add_row("--", "--", "--", "--")

        # Generate initial MACD-like data
        self.macd_history = []
        self.signal_history = []
        self.histogram_history = []
        self._generate_macd_point(0.0)

        self.set_interval(1, self.update_data)

    def _generate_macd_point(self, prev_macd: float) -> None:
        macd = prev_macd + np.random.uniform(-0.3, 0.3)
        signal = macd * 0.7 + np.random.uniform(-0.1, 0.1)
        histogram = macd - signal

        self.macd_history.append(macd)
        self.signal_history.append(signal)
        self.histogram_history.append(histogram)

        # Keep last 50 points
        if len(self.macd_history) > 50:
            self.macd_history = self.macd_history[-50:]
            self.signal_history = self.signal_history[-50:]
            self.histogram_history = self.histogram_history[-50:]

    def update_data(self) -> None:
        market = self.query_one("#market", DataTable)

        prev_close = market.get_cell(self.row1, self.col2)
        new_close = np.random.uniform(650, 690)
        volume = np.random.randint(1000, 20000)

        # open
        market.update_cell(self.row1, self.col2, round(new_close + np.random.uniform(-5, 5)))
        # high
        market.update_cell(self.row1, self.col3, round(new_close + np.random.uniform(1, 5)))
        # low
        market.update_cell(self.row1, self.col4, new_close)
        # close
        change = round(new_close - prev_close, 2)
        style = "green" if change >= 0 else "red"
        market.update_cell(self.row1, self.col5, Text(str(round(new_close, 2)), style=style))
        # change
        market.update_cell(self.row1, self.col6, Text(str(change), style=style))
        # volume
        market.update_cell(self.row1, self.col7, volume)
        # vwap
        vwap = round(new_close + np.random.uniform(1, 5))
        market.update_cell(self.row1, self.col8, vwap)

        # MACD data
        prev_macd = self.macd_history[-1] if self.macd_history else 0.0
        self._generate_macd_point(prev_macd)

        # Update indicators table
        indicators = self.query_one("#indicators", DataTable)
        ema = new_close * 0.9 + np.random.uniform(-2, 2)
        macd = self.macd_history[-1]
        signal = self.signal_history[-1]
        histogram = self.histogram_history[-1]

        hist_style = "green" if histogram >= 0 else "red"

        indicators.update_cell(self.ind_row, self.ind_ema, f"{ema:.2f}")
        indicators.update_cell(self.ind_row, self.ind_macd, f"{macd:.4f}")
        indicators.update_cell(self.ind_row, self.ind_signal, f"{signal:.4f}")
        indicators.update_cell(self.ind_row, self.ind_histogram, Text(f"{histogram:.4f}", style=hist_style))
