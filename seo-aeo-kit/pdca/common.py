"""共通: 認証情報と非機密設定の読み込み。

認証情報の優先順位:
  1. 環境変数 GOOGLE_SERVICE_ACCOUNT_JSON_B64 … 鍵JSONをBase64化した1行文字列（クラウド運用・推奨）
     ※Claude Code環境の環境変数は .env 形式（1行1組・改行不可）のため、複数行のJSONはBase64にして入れる
  2. 環境変数 GOOGLE_SERVICE_ACCOUNT_JSON … 鍵JSONの中身をそのまま（1行に収まる場合／GitHub Actions等）
  3. 環境変数 GOOGLE_APPLICATION_CREDENTIALS … 鍵JSONファイルの絶対パス（ローカル運用向け）

非機密設定（サイトURL・GA4プロパティID）は config.json に置く。
環境変数 GSC_SITE_URL / GA4_PROPERTY_ID があればそちらを優先。
"""
import base64
import json
import os
from pathlib import Path

from google.oauth2 import service_account

_HERE = Path(__file__).parent


def load_credentials(scopes=None):
    b64 = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON_B64")
    if b64 and b64.strip():
        info = json.loads(base64.b64decode(b64))
        return service_account.Credentials.from_service_account_info(info, scopes=scopes)
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if raw and raw.strip():
        info = json.loads(raw)
        return service_account.Credentials.from_service_account_info(info, scopes=scopes)
    path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if path and Path(path).exists():
        return service_account.Credentials.from_service_account_file(path, scopes=scopes)
    raise SystemExit(
        "ERROR: 認証情報が見つかりません。次のいずれかを設定してください:\n"
        "  クラウド運用: 環境変数 GOOGLE_SERVICE_ACCOUNT_JSON_B64 に鍵JSONのBase64文字列を設定\n"
        "  ローカル運用: .env の GOOGLE_APPLICATION_CREDENTIALS に鍵ファイルの絶対パスを設定"
    )


def _config():
    p = _HERE / "config.json"
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def get_site_url():
    val = os.environ.get("GSC_SITE_URL") or _config().get("gsc_site_url") or ""
    if not val:
        raise SystemExit("ERROR: GSC_SITE_URL が未設定です（config.json か環境変数で指定）")
    return val


def get_property_id():
    val = os.environ.get("GA4_PROPERTY_ID") or str(_config().get("ga4_property_id") or "")
    if not val or not val.isdigit():
        raise SystemExit("ERROR: GA4_PROPERTY_ID が未設定か数字ではありません（config.json か環境変数で指定）")
    return val
