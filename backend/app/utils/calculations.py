def calculate_pnl_percentage(initial_balance: float, current_balance: float) -> float:
    """Calculate PNL percentage"""
    return ((current_balance - initial_balance) / initial_balance) * 100

def calculate_sharpe_ratio(returns: list) -> float:
    """Calculate Sharpe ratio"""
    pass
