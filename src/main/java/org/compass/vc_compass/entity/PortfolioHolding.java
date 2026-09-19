package org.compass.vc_compass.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "portfolio_holdings")
@Data
public class PortfolioHolding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fund_name")
    private String fundName;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "snapshot_quarter")
    private String snapshotQuarter;

    private String industry;
    private String sector;

    @Column(name = "founded_year")
    private Integer foundedYear;

    private String headquarters;
    private String stage;

    @Column(name = "investment_date")
    private String investmentDate;

    @Column(name = "investment_round")
    private String investmentRound;

    @Column(name = "investment_amount")
    private Double investmentAmount;

    @Column(name = "ownership_pct")
    private Double ownershipPct;

    @Column(name = "pre_money_valuation")
    private Double preMoneyValuation;

    @Column(name = "post_money_valuation")
    private Double postMoneyValuation;

    @Column(name = "total_funding_raised")
    private Double totalFundingRaised;

    @Column(name = "latest_valuation")
    private Double latestValuation;

    private Double revenue;

    @Column(name = "revenue_growth")
    private Double revenueGrowth;

    private Double arr;

    @Column(name = "arr_growth")
    private Double arrGrowth;

    @Column(name = "gross_profit")
    private Double grossProfit;

    @Column(name = "gross_margin")
    private Double grossMargin;

    private Double ebitda;

    @Column(name = "net_income")
    private Double netIncome;

    @Column(name = "cash_balance")
    private Double cashBalance;

    @Column(name = "monthly_burn")
    private Double monthlyBurn;

    @Column(name = "runway_months")
    private Double runwayMonths;

    private Double debt;

    @Column(name = "free_cash_flow")
    private Double freeCashFlow;

    @Column(name = "customer_count")
    private Double customerCount;

    @Column(name = "customer_growth")
    private Double customerGrowth;

    @Column(name = "customer_churn")
    private Double customerChurn;

    @Column(name = "revenue_churn")
    private Double revenueChurn;

    private Double grr;
    private Double nrr;
    private Double cac;
    private Double ltv;

    @Column(name = "ltv_cac_ratio")
    private Double ltvCacRatio;

    @Column(name = "cac_payback_months")
    private Double cacPaybackMonths;

    private Double acv;
    private Double bookings;

    @Column(name = "sales_pipeline")
    private Double salesPipeline;

    @Column(name = "win_rate")
    private Double winRate;

    @Column(name = "sales_cycle_days")
    private Double salesCycleDays;

    @Column(name = "employee_count")
    private Double employeeCount;

    @Column(name = "employee_growth")
    private Double employeeGrowth;

    @Column(name = "hiring_plan")
    private String hiringPlan;

    @Column(name = "revenue_per_employee")
    private Double revenuePerEmployee;

    @Column(name = "operating_expenses")
    private Double operatingExpenses;

    @Column(name = "rd_expenses")
    private Double rdExpenses;

    @Column(name = "sales_marketing_expenses")
    private Double salesMarketingExpenses;

    @Column(name = "active_users")
    private Double activeUsers;

    @Column(name = "user_growth")
    private Double userGrowth;

    @Column(name = "user_retention")
    private Double userRetention;

    @Column(name = "product_engagement")
    private String productEngagement;

    @Column(name = "product_feature_adoption")
    private String productFeatureAdoption;

    @Column(name = "key_product_kpis")
    private String keyProductKpis;

    @Column(name = "budget_revenue_plan")
    private Double budgetRevenuePlan;

    @Column(name = "actual_revenue_vs_budget")
    private Double actualRevenueVsBudget;

    @Column(name = "actual_expenses_vs_budget")
    private Double actualExpensesVsBudget;

    @Column(name = "actual_cash_burn_vs_budget")
    private Double actualCashBurnVsBudget;

    @Column(name = "revenue_forecast")
    private Double revenueForecast;

    @Column(name = "ebitda_profit_forecast")
    private Double ebitdaProfitForecast;

    @Column(name = "key_company_milestones")
    private String keyCompanyMilestones;

    @Column(name = "strategic_objectives")
    private String strategicObjectives;

    @Column(name = "current_valuation")
    private Double currentValuation;

    @Column(name = "valuation_at_each_round")
    private String valuationAtEachRound;

    private Double dilution;

    @Column(name = "debt_financing")
    private String debtFinancing;

    @Column(name = "expected_financing_needs")
    private Double expectedFinancingNeeds;

    @Column(name = "exit_ipo_status")
    private String exitIpoStatus;

    @Column(name = "data_source")
    private String dataSource;

    @Column(name = "health_flag")
    private String healthFlag;
}