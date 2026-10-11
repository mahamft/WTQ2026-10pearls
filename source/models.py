from typing import List, Optional, Literal
from pydantic import BaseModel, Field

ChargeType = Literal[
    "energy",
    "fixed",
    "fpa",
    "quarterly_adjustment",
    "surcharge",
    "meter_rent",
    "subsidy",
    "other"
]

TaxType = Literal[
    "gst",
    "electricity_duty",
    "income_tax",
    "municipal_tax",
    "other_tax"
]

ProviderType = Literal["KE", "LESCO", "IESCO"]

class ChargeItem(BaseModel):
    type: ChargeType = Field(..., description="Type of electricity charge")
    amount: float = Field(..., description="Amount in PKR as printed (subsidies/credits must be negative)")

class TaxItem(BaseModel):
    type: TaxType = Field(..., description="Type of tax or duty")
    amount: float = Field(..., description="Amount in PKR as printed")

class BillLevel1Extraction(BaseModel):
    provider: ProviderType = Field(..., description="Utility provider: KE, LESCO, or IESCO")
    tariff: Optional[str] = Field(None, description="Tariff code exactly as printed (e.g. A1-R, A-1a(01))")
    sanctioned_load_kw: Optional[float] = Field(None, description="Sanctioned load in kW")
    bill_month: Optional[str] = Field(None, description="Billing month in YYYY-MM format")
    reading_date: Optional[str] = Field(None, description="Meter reading date in YYYY-MM-DD format")
    issue_date: Optional[str] = Field(None, description="Bill issue date in YYYY-MM-DD format")
    due_date: Optional[str] = Field(None, description="Due date (without surcharge) in YYYY-MM-DD format")
    previous_reading: Optional[float] = Field(None, description="Previous meter reading")
    current_reading: Optional[float] = Field(None, description="Current meter reading")
    units_consumed: Optional[float] = Field(None, description="Units consumed / billed for current month")
    charges: List[ChargeItem] = Field(default_factory=list, description="List of charge line items")
    total_charges: Optional[float] = Field(None, description="Subtotal of charges as printed, or null")
    taxes: List[TaxItem] = Field(default_factory=list, description="List of tax line items, or [] if only total is given")
    total_taxes: Optional[float] = Field(None, description="Subtotal of taxes as printed, or null")
    current_bill: Optional[float] = Field(None, description="Current month bill amount")
    arrears: Optional[float] = Field(None, description="Previous dues carried forward (negative if CR/credit, null if blank)")
    payable_within_due_date: Optional[float] = Field(None, description="Payable amount within due date")
    payable_after_due_date: Optional[float] = Field(None, description="Payable amount after due date (use highest if multiple shown)")
