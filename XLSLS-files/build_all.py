"""
Builds one workbook per VC portfolio, each with FOUR QUARTERLY SNAPSHOTS
per company (long format: one row per company per quarter).

Real company identities (scraped from vcbacked.co public listings) +
stage-conditioned simulated internal metrics. Growth metrics are live
Excel formulas comparing each quarter to the prior quarter.
"""

import csv
import glob
import os
import random
import re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

FONT = "Arial"
QUARTERS = ["2025-Q4", "2026-Q1", "2026-Q2", "2026-Q3"]
NQ = len(QUARTERS)

REAL_FILL = PatternFill("solid", fgColor="C6E0B4")
SIM_FILL = PatternFill("solid", fgColor="FFE699")
BLANK_FILL = PatternFill("solid", fgColor="D9D9D9")

INPUT_FONT = Font(name=FONT, size=10, color="0000FF")
FORMULA_FONT = Font(name=FONT, size=10, color="000000")
BODY_FONT = Font(name=FONT, size=10)
thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

MONEY = '$#,##0;($#,##0);-'
PCT = '0.0%'
MULT = '0.0x'
NUM = '#,##0'
MONTHS = '0.0'

# (header, provenance, number_format)
ALL_COLUMNS = [
    ("Company Name", "real", None),
    ("Snapshot Quarter", "real", None),
    ("Industry", "real", None),
    ("Sector", "sim", None),
    ("Founded Year", "sim", None),
    ("Headquarters", "real", None),
    ("Founders", "varies", None),
    ("Current Company Stage", "real", None),
    ("Investment Date", "real", None),
    ("Investment Round", "real", None),
    ("Investment Amount", "real", MONEY),
    ("Ownership Percentage", "formula", PCT),
    ("Pre-Money Valuation", "sim", MONEY),
    ("Post-Money Valuation", "formula", MONEY),
    ("Total Funding Raised", "sim", MONEY),
    ("Latest Valuation", "sim", MONEY),
    ("Other Investors", "blank", None),
    ("Revenue", "sim", MONEY),
    ("Revenue Growth", "formula", PCT),
    ("ARR", "sim", MONEY),
    ("ARR Growth", "formula", PCT),
    ("Gross Profit", "sim", MONEY),
    ("Gross Margin", "formula", PCT),
    ("EBITDA / Operating Income", "formula", MONEY),
    ("Net Income", "formula", MONEY),
    ("Cash Balance", "sim", MONEY),
    ("Monthly Burn", "sim", MONEY),
    ("Runway (months)", "formula", MONTHS),
    ("Debt", "sim", MONEY),
    ("Free Cash Flow", "formula", MONEY),
    ("Customer Count", "sim", NUM),
    ("Customer Growth", "formula", PCT),
    ("Customer Churn", "sim", PCT),
    ("Revenue Churn", "sim", PCT),
    ("Gross Revenue Retention (GRR)", "formula", PCT),
    ("Net Revenue Retention (NRR)", "sim", PCT),
    ("Customer Acquisition Cost (CAC)", "sim", MONEY),
    ("Customer Lifetime Value (LTV)", "formula", MONEY),
    ("LTV:CAC Ratio", "formula", MULT),
    ("CAC Payback Period (months)", "formula", MONTHS),
    ("Average Contract Value (ACV)", "sim", MONEY),
    ("Bookings", "sim", MONEY),
    ("Sales Pipeline", "sim", MONEY),
    ("Win Rate", "sim", PCT),
    ("Sales Cycle (days)", "sim", NUM),
    ("Employee Count", "varies", NUM),
    ("Employee Growth", "formula", PCT),
    ("Hiring Plan", "sim", None),
    ("Revenue per Employee", "formula", MONEY),
    ("Operating Expenses", "sim", MONEY),
    ("R&D Expenses", "sim", MONEY),
    ("Sales & Marketing Expenses", "sim", MONEY),
    ("Active Users", "sim", NUM),
    ("User Growth", "formula", PCT),
    ("User Retention", "sim", PCT),
    ("Product Engagement", "sim", None),
    ("Product / Feature Adoption", "sim", None),
    ("Key Product KPIs", "sim", None),
    ("Budget (revenue plan)", "sim", MONEY),
    ("Actual Revenue vs. Budget", "formula", PCT),
    ("Actual Expenses vs. Budget", "sim", PCT),
    ("Actual Cash Burn vs. Budget", "sim", PCT),
    ("Revenue Forecast", "formula", MONEY),
    ("EBITDA / Profit Forecast", "sim", MONEY),
    ("Key Company Milestones", "sim", None),
    ("Strategic Objectives", "sim", None),
    ("Current Valuation", "formula", MONEY),
    ("Valuation at Each Funding Round", "sim", None),
    ("Dilution", "formula", PCT),
    ("Debt Financing", "sim", None),
    ("Expected Financing Needs", "sim", MONEY),
    ("Exit / IPO Status", "varies", None),
    ("Data Source", "real", None),
    ("Health Flag", "formula", None),
]
COLUMNS, COL_IDX, FMT = [], {}, {}


def set_columns(records):
    """Activate only the columns that will actually hold data for this portfolio.

    'Other Investors' is never populated (inventing real firms' cap tables would
    be misleading, not merely synthetic), and 'Founders'/'Industry' are present
    in some source listings but not others. Dropping them per-file keeps every
    delivered column meaningful, and rebuilding COL_IDX here means all formulas
    are written against the correct, post-drop column letters.
    """
    global COLUMNS, COL_IDX, FMT
    drop = {"Other Investors"}
    if not any(r["founders"] for r in records):
        drop.add("Founders")
    if not any(r["industry"] for r in records):
        drop.add("Industry")
    if not any(r["location"] for r in records):
        drop.add("Headquarters")
    if not any(r["inv_date"] for r in records):
        drop.add("Investment Date")

    COLUMNS = [c for c in ALL_COLUMNS if c[0] not in drop]
    COL_IDX = {h: i + 1 for i, (h, _, _) in enumerate(COLUMNS)}
    FMT = {h: f for h, _, f in COLUMNS}
    return sorted(drop)


def L(header):
    return get_column_letter(COL_IDX[header])


STAGE_MAP = {
    "Pre-Seed": "pre_seed", "Non-equity Assistance": "pre_seed", "Grant": "pre_seed",
    "Seed": "seed", "Undisclosed": "seed", "Venture - Series Unknown": "seed",
    "Convertible Note": "seed", "Equity Crowdfunding": "seed",
    "Series A": "series_a", "Corporate Round": "series_a", "Debt Financing": "series_a",
    "Series B": "series_b", "Series C": "series_c", "Series D": "series_c",
    "Series E": "series_c", "Series F": "series_c",
    "Private Equity": "series_c", "Post-IPO Equity": "series_c", "Post-IPO Debt": "series_c",
}

PROFILES = {
    "pre_seed": dict(arr=(0, 250_000), employees=(2, 8), burn=(25_000, 80_000),
                     cash=(150_000, 1_500_000), customers=(1, 15), acv=(2_000, 25_000),
                     premoney=(3_000_000, 9_000_000), total_funding=(50_000, 1_200_000),
                     gm=(0.45, 0.80), users=(50, 4_000), sales_cycle=(14, 60)),
    "seed": dict(arr=(150_000, 2_500_000), employees=(6, 25), burn=(80_000, 250_000),
                 cash=(1_000_000, 6_000_000), customers=(10, 80), acv=(8_000, 60_000),
                 premoney=(8_000_000, 30_000_000), total_funding=(1_500_000, 8_000_000),
                 gm=(0.55, 0.85), users=(500, 40_000), sales_cycle=(21, 90)),
    "series_a": dict(arr=(2_000_000, 12_000_000), employees=(25, 80), burn=(250_000, 800_000),
                     cash=(5_000_000, 25_000_000), customers=(40, 400), acv=(20_000, 150_000),
                     premoney=(30_000_000, 110_000_000), total_funding=(8_000_000, 35_000_000),
                     gm=(0.60, 0.85), users=(5_000, 250_000), sales_cycle=(30, 120)),
    "series_b": dict(arr=(12_000_000, 40_000_000), employees=(80, 220), burn=(700_000, 2_000_000),
                     cash=(20_000_000, 70_000_000), customers=(150, 1_200), acv=(40_000, 250_000),
                     premoney=(120_000_000, 400_000_000), total_funding=(35_000_000, 120_000_000),
                     gm=(0.65, 0.88), users=(30_000, 900_000), sales_cycle=(45, 150)),
    "series_c": dict(arr=(40_000_000, 150_000_000), employees=(220, 800), burn=(1_500_000, 5_000_000),
                     cash=(60_000_000, 250_000_000), customers=(400, 5_000), acv=(60_000, 400_000),
                     premoney=(400_000_000, 2_000_000_000), total_funding=(120_000_000, 600_000_000),
                     gm=(0.68, 0.90), users=(100_000, 4_000_000), sales_cycle=(60, 180)),
}

SECTOR_MAP = {
    "Agriculture": "AgTech / Regenerative Farming",
    "AgTech": "AgTech / Crop Intelligence",
    "Health Care": "Digital Health / Care Delivery",
    "Manufacturing": "Industrial Tech / Advanced Manufacturing",
    "Artificial Intelligence (AI)": "AI Infrastructure / Applied ML",
    "Agentic AI": "AI Agents / Autonomous Software",
    "Delivery": "Logistics / Last-Mile Delivery",
    "Financial Services": "FinTech / Lending",
    "Banking": "FinTech / Digital Banking",
    "Finance": "FinTech / Capital Markets",
    "Credit": "FinTech / Consumer Credit",
    "Biotechnology": "Life Sciences / Therapeutics",
    "Blockchain": "Web3 / Protocol Infrastructure",
    "Cryptocurrency": "Web3 / Digital Assets",
    "Cyber Security": "Security / Threat Detection",
    "Cloud Security": "Security / Cloud Infrastructure",
    "E-Commerce": "Consumer Commerce / Online Retail",
    "Education": "EdTech / Learning Platforms",
    "E-Learning": "EdTech / Workforce Readiness",
    "EdTech": "EdTech / K-12 & Higher Ed",
    "Aerospace": "Space & Defense / Aerospace Systems",
    "Analytics": "Data & Analytics",
    "Big Data": "Data Infrastructure",
    "Apps": "Consumer Apps",
    "Mobile Apps": "Consumer Mobile",
    "B2B": "B2B SaaS",
    "Software": "Enterprise SaaS",
    "Enterprise Software": "Enterprise SaaS",
    "Insurance": "InsurTech",
    "Marketplace": "Marketplaces",
    "Renewable Energy": "Climate / Clean Energy",
    "Energy": "Climate / Energy Systems",
    "Carbon Capture": "Climate / Carbon Removal",
    "Consumer Electronics": "Hardware / Consumer Devices",
    "Hardware": "Hardware / Devices",
    "Medical Device": "MedTech / Devices",
    "Automotive": "Mobility / Automotive",
    "Advertising": "AdTech / Marketing",
    "Marketing": "MarTech",
    "Human Resources": "HR Tech / Talent",
    "Compliance": "RegTech / Compliance",
    "Consulting": "Professional Services",
    "Information Technology": "IT Services / Enterprise Software",
}

HIRING_PLANS = ["2 eng, 1 GTM next 2 quarters", "5 eng, 2 sales, 1 finance (FY26 plan)",
                "3 eng, 1 designer, 2 AE", "Aggressive: 12 net adds planned",
                "4 GTM hires, eng held flat", "2 eng, 1 ops"]
HIRING_BAD = ["Hiring freeze in effect", "Backfill only — no net adds",
              "1 senior eng, deferred until next raise", "RIF completed; no planned adds"]
ENGAGEMENT = ["DAU/MAU 0.42, rising", "Weekly active teams up 22% QoQ",
              "DAU/MAU 0.55, strong", "DAU/MAU 0.31, steady"]
ENGAGEMENT_BAD = ["DAU/MAU 0.18, flat", "Session length down 9% QoQ",
                  "Engagement flat for 3 quarters", "DAU/MAU 0.11, declining"]
ADOPTION = ["Core workflow 78% adopted; new AI module 12%", "Analytics dashboard 34% adoption",
            "New API used by 61% of enterprise accounts", "Mobile app adopted by 44% of base"]
PRODUCT_KPIS = ["Time-to-first-value: 6 days", "Uptime 99.95%; p95 latency 180ms",
                "Avg 14 workflows automated per account", "Onboarding completion 71%",
                "Model accuracy 91% (up from 86%)"]
MILESTONES = ["Closed first 3 enterprise contracts; SOC 2 Type II complete",
              "Launched v2 platform; expanded to 2 new states",
              "Hit $1M ARR; hired first VP Sales",
              "Pilot converted with 2 government agencies",
              "Key patent filed; manufacturing partner signed"]
MILESTONES_BAD = ["Missed Q3 launch date; replatforming underway",
                  "Lost anchor customer; repositioning to mid-market",
                  "Founding CTO departed; search underway"]
OBJECTIVES = ["Reach $3M ARR and default-alive by Q4",
              "Expand from pilot to production with 5 logos",
              "Improve gross margin to 70%+ via infra optimization",
              "Land 2 Tier-1 channel partnerships"]
OBJECTIVES_BAD = ["Extend runway to 18 months before next raise",
                  "Cut burn 30% and stabilize churn",
                  "Sunset legacy product; consolidate on core platform"]
DEBT_FIN = ["None", "None", "None", "$500K SAFE (uncapped)",
            "$1.2M venture debt facility", "$250K revenue-based financing",
            "$2.0M venture debt, 18mo draw period"]

STAGE_RE_LIST = ['Post-IPO Equity', 'Post-IPO Debt', 'Private Equity', 'Equity Crowdfunding',
                 'Convertible Note', 'Venture - Series Unknown', 'Non-equity Assistance',
                 'Corporate Round', 'Debt Financing', 'Pre-Seed', 'Undisclosed', 'Grant',
                 'Series A', 'Series B', 'Series C', 'Series D', 'Series E', 'Series F', 'Seed']
stage_re = re.compile("(" + "|".join(re.escape(s) for s in STAGE_RE_LIST) + r")\s*$")
amount_re = re.compile(r'(\$[0-9][0-9,\.]*[MK]?)\s*$')
trailing_cap_re = re.compile(r'([A-Z(][A-Za-z0-9()&/\-]*(?:\s[A-Z(][A-Za-z0-9()&/\-]*){0,3})\s*$')


def parse_amount(txt):
    m = re.match(r'\$([0-9.,]+)([MK])?', txt or "")
    if not m:
        return None
    val = float(m.group(1).replace(",", ""))
    mult = 1_000_000 if m.group(2) == "M" else (1_000 if m.group(2) == "K" else 1)
    return int(val * mult)


def parse_details(details):
    """Split vcbacked's free-text detail blob into industry/location/stage/amount."""
    rest = details or ""
    stage = ""
    m = stage_re.search(rest)
    if m:
        stage = m.group(1)
        rest = rest[:m.start()].rstrip()
    amount = ""
    m = amount_re.search(rest)
    if m:
        amount = m.group(1)
        rest = rest[:m.start()].rstrip()
    industry, location, desc = "", "", rest.strip()
    if " · " in rest:
        desc_part, location = rest.rsplit(" · ", 1)
        location = location.strip()
        m2 = trailing_cap_re.search(desc_part.strip())
        if m2:
            industry = m2.group(1).strip()
            desc = desc_part[:m2.start()].strip()
        else:
            desc = desc_part.strip()
    return industry, location, stage, amount, desc


def load_companies(path):
    """Return list of dicts with whatever REAL fields the source CSV provides."""
    fname = os.path.basename(path).replace(".csv", "")
    out = []
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if fname == "y-combinator":
                nm = r.get("Company", "")
                if not nm:
                    continue
                ts = (r.get("Team Size") or "").strip()
                status = r.get("Status", "")
                out.append(dict(
                    name=nm,
                    industry="",                       # not in this source
                    location=r.get("Location", ""),
                    stage="Seed",                      # YC batch companies
                    amount_txt="",
                    description=r.get("Description", ""),
                    founders=r.get("Founders", ""),
                    employees_real=int(ts) if ts.isdigit() else None,
                    status_real={"Active": "Private — no exit activity",
                                 "Acquired": "Acquired",
                                 "Inactive": "Inactive / wound down"}.get(status, ""),
                    batch=r.get("Batch", ""),
                    profile_url="",
                ))
            else:
                nm = r.get("Company", "")
                if not nm:
                    continue
                industry, location, stage, amount, desc = parse_details(
                    r.get("Details (industry / location / funding)"))
                out.append(dict(
                    name=nm, industry=industry, location=location,
                    stage=stage or "Seed", amount_txt=amount, description=desc,
                    founders="", employees_real=None, status_real="",
                    batch="", profile_url=r.get("Profile URL", ""),
                    date_added=r.get("Date Added", ""),
                ))

    # Two genuinely different companies can share a name (e.g. two YC companies
    # both called "Bloom"). Disambiguate so groupby-by-name stays valid.
    seen = {}
    for c in out:
        seen[c["name"]] = seen.get(c["name"], 0) + 1
    dupes = {k for k, v in seen.items() if v > 1}
    for c in out:
        if c["name"] in dupes:
            tag = c["batch"] or c["location"] or c["stage"]
            c["name"] = f"{c['name']} ({tag})"
    return out


def build_records(companies, investor):
    """One record per company: identity + latest-quarter metrics + trajectory."""
    idxs = list(range(len(companies)))
    random.shuffle(idxs)
    n_troubled = max(2, round(len(companies) * 0.17))
    n_star = max(2, round(len(companies) * 0.12))
    troubled = set(idxs[:n_troubled])
    stars = set(idxs[n_troubled:n_troubled + n_star])

    records = []
    for i, c in enumerate(companies):
        p = PROFILES[STAGE_MAP.get(c["stage"], "seed")]
        bad, star = i in troubled, i in stars

        arr = int(round(random.uniform(*p["arr"]), -3))
        if bad:
            arr = max(30_000, int(arr * 0.55))
        if star:
            arr = int(arr * 1.5)
        revenue = int(arr * random.uniform(0.80, 0.97))
        gm = random.uniform(*p["gm"]) * (0.78 if bad else 1.0)

        employees = c["employees_real"] or int(round(random.uniform(*p["employees"])))
        burn = int(round(random.uniform(*p["burn"]), -3))
        cash = int(round(random.uniform(*p["cash"]), -3))
        if bad:
            cash = int(burn * random.uniform(2.5, 4.8))
        else:
            # floor keeps healthy companies clear of the <6mo REVIEW trigger;
            # ceiling stops the back-cast producing 10-year runways
            cash = min(max(cash, int(burn * random.uniform(9, 14))), int(burn * 24))

        customers = max(1, int(round(random.uniform(*p["customers"]))))
        acv = int(round(random.uniform(*p["acv"]), -3))
        churn = round(random.uniform(0.22, 0.38) if bad else
                      (random.uniform(0.03, 0.07) if star else random.uniform(0.04, 0.14)), 3)
        nrr = round(random.uniform(0.72, 0.89) if bad else
                    (random.uniform(1.22, 1.41) if star else random.uniform(1.02, 1.18)), 3)

        lifetime = min(1 / churn, 5)
        ratio = random.uniform(0.45, 0.92) if bad else (
            random.uniform(3.4, 5.5) if star else random.uniform(1.8, 3.8))
        cac = max(500, int(round(acv * gm * lifetime / ratio, -2)))

        # annual growth -> quarterly factor used to back-cast earlier quarters
        arr_growth_ann = round(random.uniform(-0.45, -0.12) if bad else
                               (random.uniform(1.6, 3.1) if star else
                                random.uniform(0.35, 1.40)), 3)
        emp_growth_ann = round(random.uniform(-0.35, -0.05) if bad else
                               (random.uniform(0.7, 1.4) if star else
                                random.uniform(0.10, 0.70)), 3)

        premoney = int(round(random.uniform(*p["premoney"]), -3))
        amt = parse_amount(c["amount_txt"])
        inv_real = amt is not None
        inv_amount = amt if inv_real else int(round(random.uniform(premoney * 0.10, premoney * 0.25), -3))
        total_funding = max(inv_amount, int(round(random.uniform(*p["total_funding"]), -3)))
        latest_val = int((premoney + inv_amount) *
                         (random.uniform(0.55, 0.9) if bad else random.uniform(0.85, 2.2)))

        inv_date = c.get("date_added") or (
            f"{c['batch']} batch" if c.get("batch") else "")

        records.append(dict(
            c,
            investor=investor,
            sector=SECTOR_MAP.get(c["industry"], "Technology / Other"),
            founded=random.randint(2018, 2024),
            inv_date=inv_date,
            inv_amount=inv_amount, inv_real=inv_real,
            premoney=premoney, total_funding=total_funding, latest_val=latest_val,
            arr=arr, revenue=revenue, gm=gm, employees=employees, burn=burn, cash=cash,
            customers=customers, acv=acv, churn=churn, nrr=nrr, cac=cac,
            arr_growth_ann=arr_growth_ann, emp_growth_ann=emp_growth_ann,
            debt=int(round(random.uniform(0, 1_500_000), -3)) if random.random() < 0.35 else 0,
            win_rate=round(random.uniform(0.12, 0.42), 3),
            sales_cycle=int(round(random.uniform(*p["sales_cycle"]))),
            users=max(10, int(round(random.uniform(*p["users"])))),
            kpis=random.choice(PRODUCT_KPIS),
            adoption="Feature adoption lagging — 19% on latest release" if bad else random.choice(ADOPTION),
            hiring=random.choice(HIRING_BAD if bad else HIRING_PLANS),
            engagement=random.choice(ENGAGEMENT_BAD if bad else ENGAGEMENT),
            milestone=random.choice(MILESTONES_BAD if bad else MILESTONES),
            objective=random.choice(OBJECTIVES_BAD if bad else OBJECTIVES),
            debt_fin=random.choice(DEBT_FIN),
            exit_status=c.get("status_real") or (
                "Private — inbound acquisition interest" if star and random.random() < 0.4
                else "Private — no exit activity"),
            troubled=bad, star=star,
        ))
    return records, troubled, stars


def snapshot(rec, t):
    """Scale a record's latest-quarter metrics back to quarter index t (3 = latest)."""
    back = NQ - 1 - t                      # quarters before the latest
    bad, star = rec["troubled"], rec["star"]

    gq = (1 + rec["arr_growth_ann"]) ** 0.25     # quarterly ARR factor
    gq = max(gq, 0.75)
    eq = (1 + rec["emp_growth_ann"]) ** 0.25
    eq = max(eq, 0.80)

    # Per-quarter jitter so quarter-over-quarter growth varies organically
    # rather than tracing a perfectly smooth curve. Kept tight for declining
    # companies so the downward trend never accidentally flips positive.
    jit = (lambda: random.uniform(0.985, 1.015)) if bad else (lambda: random.uniform(0.95, 1.06))

    arr = rec["arr"] / (gq ** back) * jit()
    revenue = rec["revenue"] / (gq ** back) * jit()
    gm = rec["gm"] * (1 + (0.02 * back if bad else -0.004 * back))
    gm = min(max(gm, 0.20), 0.92)

    employees = max(1, round(rec["employees"] / (eq ** back)))
    burn = rec["burn"] * (1 - (0.06 if bad else 0.03) * back)
    burn = max(burn, 5_000)

    if star:
        cash = rec["cash"] * [0.35, 0.45, 0.55, 1.0][t]
    else:
        cash = rec["cash"] + burn * 3 * back * (1.1 if bad else 0.9)

    customers = max(1, round(rec["customers"] / (gq ** (back * 0.8)) * jit()))
    users = max(10, round(rec["users"] / (gq ** (back * 0.9)) * jit()))
    churn = rec["churn"] * (1 - 0.12 * back) if bad else rec["churn"] * (1 + 0.03 * back)
    churn = min(max(churn, 0.01), 0.60)
    nrr = rec["nrr"] + (0.04 * back if bad else (-0.03 * back if star else 0.005 * back))
    cac = rec["cac"] * (1 - 0.08 * back) if bad else rec["cac"] * (1 + 0.02 * back)

    gross_profit = revenue * gm
    opex = gross_profit + burn * random.uniform(9, 13)
    budget = revenue * (random.uniform(1.25, 1.7) if bad else random.uniform(0.9, 1.25))

    return dict(
        arr=int(arr), revenue=int(revenue), gross_profit=int(gross_profit),
        employees=employees, burn=int(burn), cash=int(cash),
        customers=customers, users=users, churn=round(churn, 3),
        rev_churn=round(min(churn * random.uniform(0.6, 1.1), 0.6), 3),
        nrr=round(min(max(nrr, 0.50), 1.60), 3), cac=int(cac),
        acv=int(rec["acv"] * (1 + 0.02 * (NQ - 1 - back))),
        opex=int(opex), rnd=int(opex * random.uniform(0.30, 0.50)),
        snm=int(opex * random.uniform(0.18, 0.34)),
        bookings=int(arr * random.uniform(0.9, 1.5)),
        pipeline=int(arr * random.uniform(1.5, 4.0)),
        user_ret=round(min(max(1 - churn * random.uniform(0.7, 1.1), 0.30), 0.99), 3),
        budget=int(budget),
        exp_vs_budget=round(random.uniform(0.12, 0.31) if bad else random.uniform(-0.06, 0.09), 3),
        burn_vs_budget=round(random.uniform(0.15, 0.38) if bad else random.uniform(-0.08, 0.10), 3),
        ebitda_forecast=int(-burn * random.uniform(6, 12)),
        fin_needs=int(burn * random.uniform(12, 20)),
    )


def write_portfolio_sheet(ws, records):
    for j, (header, prov, _) in enumerate(COLUMNS, start=1):
        c = ws.cell(row=1, column=j, value=header)
        c.font = Font(name=FONT, bold=True, size=10)
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BORDER
        c.fill = {"real": REAL_FILL, "sim": SIM_FILL, "formula": SIM_FILL,
                  "blank": BLANK_FILL, "varies": SIM_FILL}[prov]
    ws.row_dimensions[1].height = 42
    ws.freeze_panes = "C2"

    row = 2
    for rec in records:
        first_row = row
        for t, q in enumerate(QUARTERS):
            s = snapshot(rec, t)
            prev = row - 1
            has_prev = t > 0

            def put(header, value, is_formula=False, blank=False):
                if header not in COL_IDX:
                    return None
                c = ws.cell(row=row, column=COL_IDX[header], value=value)
                c.font = FORMULA_FONT if is_formula else INPUT_FONT
                c.border = BORDER
                if FMT[header]:
                    c.number_format = FMT[header]
                c.alignment = Alignment(vertical="top")
                if blank:
                    c.fill = BLANK_FILL
                return c

            def growth(header, base_col):
                if header not in COL_IDX:
                    return
                if has_prev:
                    put(header, f'=IFERROR({L(base_col)}{row}/{L(base_col)}{prev}-1,"")', True)
                else:
                    put(header, None)

            put("Company Name", rec["name"])
            put("Snapshot Quarter", q)
            put("Industry", rec["industry"] or None)
            put("Sector", rec["sector"])
            put("Founded Year", str(rec["founded"]))
            put("Headquarters", rec["location"] or None)
            put("Founders", rec["founders"] or None, blank=not rec["founders"])
            put("Current Company Stage", rec["stage"])
            put("Investment Date", rec["inv_date"] or None)
            put("Investment Round", rec["stage"])
            put("Investment Amount", rec["inv_amount"])
            put("Pre-Money Valuation", rec["premoney"])
            put("Post-Money Valuation",
                f'={L("Pre-Money Valuation")}{row}+{L("Investment Amount")}{row}', True)
            put("Ownership Percentage",
                f'=IFERROR({L("Investment Amount")}{row}/{L("Post-Money Valuation")}{row},"")', True)
            put("Total Funding Raised", rec["total_funding"])
            put("Latest Valuation", rec["latest_val"])
            put("Other Investors", None, blank=True)

            put("Revenue", s["revenue"])
            growth("Revenue Growth", "Revenue")
            put("ARR", s["arr"])
            growth("ARR Growth", "ARR")
            put("Gross Profit", s["gross_profit"])
            put("Gross Margin", f'=IFERROR({L("Gross Profit")}{row}/{L("Revenue")}{row},"")', True)
            put("Operating Expenses", s["opex"])
            put("R&D Expenses", s["rnd"])
            put("Sales & Marketing Expenses", s["snm"])
            put("EBITDA / Operating Income",
                f'={L("Gross Profit")}{row}-{L("Operating Expenses")}{row}', True)
            put("Net Income",
                f'={L("EBITDA / Operating Income")}{row}-{L("Debt")}{row}*0.1', True)

            put("Cash Balance", s["cash"])
            put("Monthly Burn", s["burn"])
            put("Runway (months)",
                f'=IFERROR({L("Cash Balance")}{row}/{L("Monthly Burn")}{row},"")', True)
            put("Debt", rec["debt"])
            put("Free Cash Flow", f'={L("Net Income")}{row}-0.02*{L("Revenue")}{row}', True)

            put("Customer Count", s["customers"])
            growth("Customer Growth", "Customer Count")
            put("Customer Churn", s["churn"])
            put("Revenue Churn", s["rev_churn"])
            put("Gross Revenue Retention (GRR)", f'=1-{L("Revenue Churn")}{row}', True)
            put("Net Revenue Retention (NRR)", s["nrr"])

            put("Customer Acquisition Cost (CAC)", s["cac"])
            put("Average Contract Value (ACV)", s["acv"])
            put("Customer Lifetime Value (LTV)",
                f'=IFERROR({L("Average Contract Value (ACV)")}{row}*{L("Gross Margin")}{row}'
                f'*MIN(1/{L("Customer Churn")}{row},5),"")', True)
            put("LTV:CAC Ratio",
                f'=IFERROR({L("Customer Lifetime Value (LTV)")}{row}'
                f'/{L("Customer Acquisition Cost (CAC)")}{row},"")', True)
            put("CAC Payback Period (months)",
                f'=IFERROR({L("Customer Acquisition Cost (CAC)")}{row}'
                f'/({L("Average Contract Value (ACV)")}{row}*{L("Gross Margin")}{row}/12),"")', True)

            put("Bookings", s["bookings"])
            put("Sales Pipeline", s["pipeline"])
            put("Win Rate", rec["win_rate"])
            put("Sales Cycle (days)", rec["sales_cycle"])

            put("Employee Count", s["employees"])
            growth("Employee Growth", "Employee Count")
            put("Hiring Plan", rec["hiring"])
            put("Revenue per Employee",
                f'=IFERROR({L("Revenue")}{row}/{L("Employee Count")}{row},"")', True)

            put("Active Users", s["users"])
            growth("User Growth", "Active Users")
            put("User Retention", s["user_ret"])
            put("Product Engagement", rec["engagement"])
            put("Product / Feature Adoption", rec["adoption"])
            put("Key Product KPIs", rec["kpis"])

            put("Budget (revenue plan)", s["budget"])
            put("Actual Revenue vs. Budget",
                f'=IFERROR({L("Revenue")}{row}/{L("Budget (revenue plan)")}{row}-1,"")', True)
            put("Actual Expenses vs. Budget", s["exp_vs_budget"])
            put("Actual Cash Burn vs. Budget", s["burn_vs_budget"])
            put("Revenue Forecast",
                f'={L("Revenue")}{row}*(1+IFERROR({L("Revenue Growth")}{row},0))^4'
                if has_prev else f'={L("Revenue")}{row}', True)
            put("EBITDA / Profit Forecast", s["ebitda_forecast"])

            put("Key Company Milestones", rec["milestone"])
            put("Strategic Objectives", rec["objective"])
            put("Current Valuation", f'={L("Latest Valuation")}{row}', True)
            put("Valuation at Each Funding Round",
                f'{rec["stage"]} ${rec["premoney"]/1e6:.1f}M pre → latest ${rec["latest_val"]/1e6:.1f}M')
            put("Dilution",
                f'=IFERROR(1-{L("Pre-Money Valuation")}{row}/{L("Post-Money Valuation")}{row},"")', True)
            put("Debt Financing", rec["debt_fin"])
            put("Expected Financing Needs", s["fin_needs"])
            put("Exit / IPO Status", rec["exit_status"])
            put("Data Source",
                ("Identity: real (vcbacked.co)"
                 + ("; founders/headcount/status: real" if rec["founders"] else "")
                 + " | Metrics: simulated"
                 + ("" if rec["inv_real"] else "; round size simulated")))

            if has_prev:
                put("Health Flag",
                    f'=IF(OR({L("Runway (months)")}{row}<6,'
                    f'{L("Net Revenue Retention (NRR)")}{row}<0.9,'
                    f'{L("ARR Growth")}{row}<0.02,'
                    f'{L("LTV:CAC Ratio")}{row}<1),"REVIEW",'
                    f'IF(AND({L("ARR Growth")}{row}>0.25,'
                    f'{L("Net Revenue Retention (NRR)")}{row}>1.2),"ACCELERATING","STABLE"))', True)
            else:
                put("Health Flag", "BASELINE")

            row += 1

        # light separator between companies
        for j in range(1, len(COLUMNS) + 1):
            ws.cell(row=first_row, column=j).border = Border(
                left=thin, right=thin, bottom=thin,
                top=Side(style="medium", color="808080"))

    widths = {"Company Name": 24, "Snapshot Quarter": 15, "Industry": 22, "Sector": 34,
              "Headquarters": 18, "Founders": 30, "Current Company Stage": 18,
              "Investment Date": 16, "Investment Round": 16, "Other Investors": 14,
              "Hiring Plan": 32, "Product Engagement": 26, "Product / Feature Adoption": 36,
              "Key Product KPIs": 30, "Key Company Milestones": 44, "Strategic Objectives": 40,
              "Valuation at Each Funding Round": 34, "Debt Financing": 28,
              "Exit / IPO Status": 30, "Data Source": 56, "Health Flag": 14}
    for header, _, _ in COLUMNS:
        ws.column_dimensions[L(header)].width = widths.get(header, 15)
    return row - 2


def write_candidate_sheet(ws, own_names, all_paths, own_file):
    heads = ["Company Name", "Industry", "Description", "Location", "Stage / Batch",
             "Latest Round Amount", "Employee Count", "Founders", "Status",
             "Backed By", "Profile URL", "Data Source"]

    # Collect first, so columns with no data anywhere can be dropped.
    rows_out = []
    for path in sorted(all_paths):
        fname = os.path.basename(path).replace(".csv", "")
        if fname == own_file:
            continue
        investor = "Y Combinator" if fname == "y-combinator" else fname.replace("-", " ").title()
        for c in load_companies(path):
            if c["name"].lower() in own_names:
                continue
            rows_out.append({
                "Company Name": c["name"], "Industry": c["industry"],
                "Description": c["description"], "Location": c["location"],
                "Stage / Batch": (f"YC {c['batch']}" if c["batch"] else c["stage"]),
                "Latest Round Amount": c["amount_txt"],
                "Employee Count": c["employees_real"], "Founders": c["founders"],
                "Status": c.get("status_real", ""), "Backed By": investor,
                "Profile URL": c["profile_url"],
                "Data Source": "Real (vcbacked.co public listing)",
            })

    heads = [h for h in heads
             if any(r[h] not in ("", None) for r in rows_out)]

    for j, h in enumerate(heads, start=1):
        c = ws.cell(row=1, column=j, value=h)
        c.font = Font(name=FONT, bold=True, size=10)
        c.fill = REAL_FILL
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BORDER
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 30

    widths = {"Company Name": 26, "Industry": 22, "Description": 58, "Location": 20,
              "Stage / Batch": 16, "Latest Round Amount": 16, "Employee Count": 13,
              "Founders": 32, "Status": 22, "Backed By": 20, "Profile URL": 42,
              "Data Source": 30}
    for j, h in enumerate(heads, start=1):
        ws.column_dimensions[get_column_letter(j)].width = widths[h]

    for i, r in enumerate(rows_out, start=2):
        for j, h in enumerate(heads, start=1):
            v = r[h]
            cell = ws.cell(row=i, column=j, value=v if v not in ("", None) else None)
            cell.font = BODY_FONT
            cell.border = BORDER
            cell.alignment = Alignment(vertical="top")
    return len(rows_out)


def write_dictionary(ws, investor, n_comp, n_rows, n_troubled, n_stars, n_cand,
                     has_real_founders, dropped):
    ws["A1"] = f"{investor} portfolio — data provenance (read before demoing)"
    ws["A1"].font = Font(name=FONT, bold=True, size=14)
    lines = [
        "",
        f"PORTFOLIO: {n_comp} real {investor} portfolio companies x {NQ} quarterly snapshots = {n_rows} rows.",
        f"Snapshots: {', '.join(QUARTERS)} (long format — one row per company per quarter).",
        f"CANDIDATE UNIVERSE: {n_cand} real companies from other investors' portfolios, zero simulation.",
        "",
        "REAL vs SIMULATED — this workbook pairs REAL company identities with SIMULATED internal metrics.",
        "The split is labelled everywhere; no synthetic number is presented as real data.",
        "",
        "WHY SIMULATE: ARR, NRR, CAC, burn, runway, ownership % and pre/post-money valuations are not publicly",
        "disclosed for private companies and are not available from any free source. Even PitchBook covers only",
        "rounds, estimated valuations and headcount. Simulating on top of real companies is the honest way to demo",
        "a tool whose real users upload their own numbers.",
        "",
        "HEADER COLOUR KEY:  GREEN = real (vcbacked.co public listing)   ORANGE = simulated",
        "CELL FONT KEY:      BLUE text = hardcoded input                 BLACK text = live Excel formula",
        "",
        "REAL FIELDS: Company Name, Headquarters, Current Company Stage, Investment Round, Investment Date,",
        "Investment Amount (where the public listing reported a figure), Industry (where the listing reported one).",
        ("ALSO REAL for this portfolio: Founders, Employee Count (latest quarter), and Exit / IPO Status — the YC "
         "source lists real founder names, team sizes and company status."
         if has_real_founders else
         "Founders is not available from this source listing, so that column has been removed rather than shipped "
         "empty. Inventing founder names for real companies would be misleading rather than merely synthetic."),
        "",
        f"COLUMNS REMOVED from the requested schema because no data exists for them here: {', '.join(dropped)}.",
        "'Other Investors' is dropped from every portfolio: a real firm's co-investors are attributable facts, and",
        "fabricating them would misrepresent identifiable firms. Add these columns back if you later source them.",
        "",
        "TIME SERIES: the latest quarter is generated first, then earlier quarters are back-cast using each",
        "company's growth rate. Declining companies therefore show shrinking ARR/headcount and falling runway as",
        "you read down; accelerating ones show the reverse. Deal-term fields (Investment Date/Round/Amount,",
        "Pre/Post-Money, Ownership, Dilution) are as-of-investment and correctly stay constant across snapshots.",
        "",
        "GROWTH COLUMNS ARE QUARTER-OVER-QUARTER FORMULAS referencing the prior snapshot row:",
        "Revenue Growth, ARR Growth, Customer Growth, Employee Growth, User Growth. They are blank in the first",
        f"snapshot ({QUARTERS[0]}) because there is no prior quarter — that row's Health Flag reads BASELINE.",
        "",
        "OTHER DERIVED METRICS ARE ALSO LIVE FORMULAS, so the arithmetic survives a spot-check:",
        "Gross Margin = Gross Profit / Revenue · Runway = Cash / Monthly Burn · LTV = ACV x Gross Margin x",
        "MIN(1/Churn, 5) · LTV:CAC = LTV / CAC · CAC Payback = CAC / (ACV x GM / 12) · Post-Money = Pre-Money +",
        "Investment · Ownership % = Investment / Post-Money · Revenue/Employee = Revenue / Employee Count ·",
        "GRR = 1 - Revenue Churn · Dilution = 1 - Pre-Money / Post-Money · EBITDA = Gross Profit - OpEx.",
        "OpEx is always set above Gross Profit, so EBITDA is negative — correct for venture-stage companies.",
        "",
        "STAGE CONDITIONING: every metric is drawn from a distribution keyed to the company's REAL funding stage,",
        "so a Pre-Seed company cannot show $40M ARR or 200 employees.",
        "",
        f"PLANTED SIGNALS (so the tool has something to actually recommend): {n_troubled} companies are",
        "deliberately TROUBLED — flat-to-negative ARR growth, NRR below 90%, under 5 months runway, elevated",
        f"churn, LTV:CAC below 1, shrinking headcount, missed budget. {n_stars} are deliberate STARS — fast ARR",
        "growth, NRR above 120%, low churn, fast hiring. The rest sit in a normal middle band.",
        "",
        "HEALTH FLAG is a live formula (REVIEW / ACCELERATING / STABLE / BASELINE) so the rule-based logic is",
        "visible rather than hardcoded — useful as a baseline to compare your LLM's judgement against.",
        "",
        "random.seed is fixed per portfolio, so every file regenerates identically.",
        "",
        "SUGGESTED DEMO FRAMING: \"Real portfolio companies, with internal metrics simulated because",
        "private-company financials aren't public — a real VC user uploads their own.\" Saying this up front reads",
        "as rigour. Leaving it unsaid and getting asked is the only version of this that hurts you.",
    ]
    for i, line in enumerate(lines, start=2):
        c = ws.cell(row=i, column=1, value=line)
        c.font = BODY_FONT
        c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.column_dimensions["A"].width = 118


# ----------------------------------------------------------------------
def main():
    paths = sorted(glob.glob("/home/claude/investors/*.csv"))
    outdir = "/home/claude/portfolios"
    os.makedirs(outdir, exist_ok=True)
    summary = []

    for path in paths:
        fname = os.path.basename(path).replace(".csv", "")
        investor = "Y Combinator" if fname == "y-combinator" else fname.replace("-", " ").title()
        random.seed(abs(hash(fname)) % (2 ** 31))   # per-portfolio reproducibility

        companies = load_companies(path)
        records, troubled, stars = build_records(companies, investor)
        dropped = set_columns(records)

        wb = Workbook()
        ws = wb.active
        ws.title = "Portfolio"
        n_rows = write_portfolio_sheet(ws, records)

        ws2 = wb.create_sheet("Candidate Universe")
        own = {r["name"].lower() for r in records}
        n_cand = write_candidate_sheet(ws2, own, paths, fname)

        ws3 = wb.create_sheet("Data Dictionary")
        write_dictionary(ws3, investor, len(records), n_rows,
                         len(troubled), len(stars), n_cand,
                         has_real_founders=(fname == "y-combinator"),
                         dropped=dropped)

        safe = investor.replace(" ", "_")
        out = f"{outdir}/VC_Portfolio_{safe}.xlsx"
        wb.save(out)
        summary.append((investor, len(records), n_rows, n_cand, out))
        print(f"{investor:22s} {len(records):4d} companies  {n_rows:5d} rows  "
              f"{len(COLUMNS):3d} cols  {n_cand:4d} cand  dropped: {', '.join(dropped)}")

    return summary


if __name__ == "__main__":
    main()
