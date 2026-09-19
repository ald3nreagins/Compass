"""
Loads all VC portfolio xlsx files into Supabase Postgres.

Each xlsx file is expected to have three sheets:
  - "Portfolio"           -> goes into portfolio_holdings table (all 72 columns)
  - "Candidate Universe"  -> goes into candidate_companies table
  - "Data Dictionary"     -> ignored (documentation only)

The fund name is derived from the filename, e.g.
  "VC_Portfolio_Alumni_Ventures.xlsx" -> "Alumni Ventures"

SETUP (run once):
    pip install pandas openpyxl psycopg2-binary sqlalchemy

USAGE:
    export SUPABASE_DB_PASSWORD=your_actual_password
    python load_portfolio_to_supabase_full.py
"""

import os
import re
import glob
import pandas as pd
from sqlalchemy import create_engine, text

# ---- CONFIG ----
DB_HOST = "aws-0-us-east-2.pooler.supabase.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres.lltpgxdjslbpzzehgdvc"
DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD")

XLSX_FOLDER = "XLSLS-files"  # folder containing your 9 xlsx files

if not DB_PASSWORD:
    raise RuntimeError(
        "SUPABASE_DB_PASSWORD environment variable not set. "
        "Run: export SUPABASE_DB_PASSWORD=your_actual_password"
    )

CONN_STRING = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ---- Full Portfolio column mapping: (excel column name, postgres column name, postgres type) ----
PORTFOLIO_COLUMNS = [
    ("Company Name", "company_name", "TEXT"),
    ("Snapshot Quarter", "snapshot_quarter", "TEXT"),
    ("Industry", "industry", "TEXT"),
    ("Sector", "sector", "TEXT"),
    ("Founded Year", "founded_year", "INTEGER"),
    ("Headquarters", "headquarters", "TEXT"),
    ("Current Company Stage", "stage", "TEXT"),
    ("Investment Date", "investment_date", "TEXT"),
    ("Investment Round", "investment_round", "TEXT"),
    ("Investment Amount", "investment_amount", "NUMERIC"),
    ("Ownership Percentage", "ownership_pct", "NUMERIC"),
    ("Pre-Money Valuation", "pre_money_valuation", "NUMERIC"),
    ("Post-Money Valuation", "post_money_valuation", "NUMERIC"),
    ("Total Funding Raised", "total_funding_raised", "NUMERIC"),
    ("Latest Valuation", "latest_valuation", "NUMERIC"),
    ("Revenue", "revenue", "NUMERIC"),
    ("Revenue Growth", "revenue_growth", "NUMERIC"),
    ("ARR", "arr", "NUMERIC"),
    ("ARR Growth", "arr_growth", "NUMERIC"),
    ("Gross Profit", "gross_profit", "NUMERIC"),
    ("Gross Margin", "gross_margin", "NUMERIC"),
    ("EBITDA / Operating Income", "ebitda", "NUMERIC"),
    ("Net Income", "net_income", "NUMERIC"),
    ("Cash Balance", "cash_balance", "NUMERIC"),
    ("Monthly Burn", "monthly_burn", "NUMERIC"),
    ("Runway (months)", "runway_months", "NUMERIC"),
    ("Debt", "debt", "NUMERIC"),
    ("Free Cash Flow", "free_cash_flow", "NUMERIC"),
    ("Customer Count", "customer_count", "NUMERIC"),
    ("Customer Growth", "customer_growth", "NUMERIC"),
    ("Customer Churn", "customer_churn", "NUMERIC"),
    ("Revenue Churn", "revenue_churn", "NUMERIC"),
    ("Gross Revenue Retention (GRR)", "grr", "NUMERIC"),
    ("Net Revenue Retention (NRR)", "nrr", "NUMERIC"),
    ("Customer Acquisition Cost (CAC)", "cac", "NUMERIC"),
    ("Customer Lifetime Value (LTV)", "ltv", "NUMERIC"),
    ("LTV:CAC Ratio", "ltv_cac_ratio", "NUMERIC"),
    ("CAC Payback Period (months)", "cac_payback_months", "NUMERIC"),
    ("Average Contract Value (ACV)", "acv", "NUMERIC"),
    ("Bookings", "bookings", "NUMERIC"),
    ("Sales Pipeline", "sales_pipeline", "NUMERIC"),
    ("Win Rate", "win_rate", "NUMERIC"),
    ("Sales Cycle (days)", "sales_cycle_days", "NUMERIC"),
    ("Employee Count", "employee_count", "NUMERIC"),
    ("Employee Growth", "employee_growth", "NUMERIC"),
    ("Hiring Plan", "hiring_plan", "TEXT"),
    ("Revenue per Employee", "revenue_per_employee", "NUMERIC"),
    ("Operating Expenses", "operating_expenses", "NUMERIC"),
    ("R&D Expenses", "rd_expenses", "NUMERIC"),
    ("Sales & Marketing Expenses", "sales_marketing_expenses", "NUMERIC"),
    ("Active Users", "active_users", "NUMERIC"),
    ("User Growth", "user_growth", "NUMERIC"),
    ("User Retention", "user_retention", "NUMERIC"),
    ("Product Engagement", "product_engagement", "TEXT"),
    ("Product / Feature Adoption", "product_feature_adoption", "TEXT"),
    ("Key Product KPIs", "key_product_kpis", "TEXT"),
    ("Budget (revenue plan)", "budget_revenue_plan", "NUMERIC"),
    ("Actual Revenue vs. Budget", "actual_revenue_vs_budget", "NUMERIC"),
    ("Actual Expenses vs. Budget", "actual_expenses_vs_budget", "NUMERIC"),
    ("Actual Cash Burn vs. Budget", "actual_cash_burn_vs_budget", "NUMERIC"),
    ("Revenue Forecast", "revenue_forecast", "NUMERIC"),
    ("EBITDA / Profit Forecast", "ebitda_profit_forecast", "NUMERIC"),
    ("Key Company Milestones", "key_company_milestones", "TEXT"),
    ("Strategic Objectives", "strategic_objectives", "TEXT"),
    ("Current Valuation", "current_valuation", "NUMERIC"),
    ("Valuation at Each Funding Round", "valuation_at_each_round", "TEXT"),
    ("Dilution", "dilution", "NUMERIC"),
    ("Debt Financing", "debt_financing", "TEXT"),
    ("Expected Financing Needs", "expected_financing_needs", "NUMERIC"),
    ("Exit / IPO Status", "exit_ipo_status", "TEXT"),
    ("Data Source", "data_source", "TEXT"),
    ("Health Flag", "health_flag", "TEXT"),
]

CANDIDATE_COLUMN_MAP = {
    "Company Name": "company_name",
    "Industry": "industry",
    "Description": "description",
    "Location": "location",
    "Stage / Batch": "stage",
    "Latest Round Amount": "latest_round_amount",
    "Backed By": "backed_by",
    "Profile URL": "profile_url",
}


def fund_name_from_filename(path: str) -> str:
    """VC_Portfolio_Alumni_Ventures.xlsx -> 'Alumni Ventures'"""
    base = os.path.basename(path)
    base = re.sub(r"^VC_Portfolio_", "", base, flags=re.IGNORECASE)
    base = re.sub(r"\.xlsx$", "", base, flags=re.IGNORECASE)
    return base.replace("_", " ").strip()


def create_tables(engine):
    portfolio_cols_sql = ",\n                ".join(
        f"{pg_name} {pg_type}" for _, pg_name, pg_type in PORTFOLIO_COLUMNS
    )
    with engine.begin() as conn:
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS portfolio_holdings (
                id SERIAL PRIMARY KEY,
                fund_name TEXT,
                {portfolio_cols_sql}
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS candidate_companies (
                id SERIAL PRIMARY KEY,
                fund_name TEXT,
                company_name TEXT,
                industry TEXT,
                description TEXT,
                location TEXT,
                stage TEXT,
                latest_round_amount TEXT,
                backed_by TEXT,
                profile_url TEXT
            );
        """))
    print("Tables created (or already exist).")


def load_file(engine, path: str):
    fund = fund_name_from_filename(path)
    print(f"\nProcessing {os.path.basename(path)} -> fund_name='{fund}'")

    xls = pd.ExcelFile(path)

    if "Portfolio" in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name="Portfolio")
        rename_map = {excel_name: pg_name for excel_name, pg_name, _ in PORTFOLIO_COLUMNS}
        df = df.rename(columns=rename_map)
        keep_cols = [pg_name for _, pg_name, _ in PORTFOLIO_COLUMNS if pg_name in df.columns]
        df = df[keep_cols]
        df["fund_name"] = fund
        df.to_sql("portfolio_holdings", engine, if_exists="append", index=False)
        print(f"  Inserted {len(df)} rows into portfolio_holdings ({len(keep_cols)} columns)")
    else:
        print("  WARNING: no 'Portfolio' sheet found, skipping")

    if "Candidate Universe" in xls.sheet_names:
        df2 = pd.read_excel(xls, sheet_name="Candidate Universe")
        df2 = df2.rename(columns=CANDIDATE_COLUMN_MAP)
        keep_cols2 = [c for c in CANDIDATE_COLUMN_MAP.values() if c in df2.columns]
        df2 = df2[keep_cols2]
        df2["fund_name"] = fund
        df2 = df2.drop_duplicates(subset=["company_name"])
        df2.to_sql("candidate_companies", engine, if_exists="append", index=False)
        print(f"  Inserted {len(df2)} rows into candidate_companies")
    else:
        print("  WARNING: no 'Candidate Universe' sheet found, skipping")


def main():
    engine = create_engine(CONN_STRING)
    create_tables(engine)

    files = glob.glob(os.path.join(XLSX_FOLDER, "*.xlsx"))
    if not files:
        print(f"No .xlsx files found in {XLSX_FOLDER}")
        return

    print(f"Found {len(files)} xlsx file(s): {[os.path.basename(f) for f in files]}")

    for path in files:
        load_file(engine, path)

    print("\nDone.")


if __name__ == "__main__":
    main()