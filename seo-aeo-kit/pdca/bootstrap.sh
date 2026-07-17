#!/usr/bin/env bash
# PDCAスクリプトの実行環境を用意する（毎日の自動実行の最初に1回走らせる）。
# 一部のクラウド環境ではシステム同梱の cryptography が壊れて Google 認証が panic するため、
# 動作するwheelで上書きしてから依存をインストールする。
set -e
cd "$(dirname "$0")"
python3 -m pip install -q --ignore-installed "cryptography>=42" || true
python3 -m pip install -q -r requirements.txt
echo "bootstrap done"
