import gspread, pandas as pd
from google.oauth2.service_account import Credentials

def sheet_client(creds_path):
    scopes=['https://www.googleapis.com/auth/spreadsheets']
    creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
    return gspread.authorize(creds)

def to_sheet(gc, sheet_id, name, df):
    sh = gc.open_by_key(sheet_id)
    try: ws = sh.worksheet(name); ws.clear()
    except gspread.WorksheetNotFound: ws = sh.add_worksheet(name, rows=2, cols=2)
    ws.update([df.columns.tolist()] + df.values.tolist())