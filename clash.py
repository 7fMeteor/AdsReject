import requests
import yaml
import pytz
from datetime import datetime
import os
import subprocess
import platform
import gzip
import shutil

# 全局配置
OUTPUT_FILE = "clash-ads-reject.yaml"
MRS_OUTPUT_FILE = "clash-ads-reject.mrs"
MIHOMO_VERSION = "v1.19.18"
URLS = [
    "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
    "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Clash.yaml",
    "https://anti-ad.net/clash.yaml"
]

def fetch_rules(urls):
    """
    从远程源获取规则并去重
    支持 YAML payload 和 纯文本格式
    """
    unique_rules = set()
    print(f"info: 开始从 {len(urls)} 个源获取规则...")

    for url in urls:
        try:
            print(f"download: 正在下载 {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            content = response.text

            # 策略 A: 尝试解析为 YAML (如 AWAvenue, Anti-AD)
            try:
                data = yaml.safe_load(content)
                if isinstance(data, dict) and 'payload' in data:
                    count_before = len(unique_rules)
                    for rule in data['payload']:
                        clean_rule = rule.strip()
                        # 基本校验：非空且非注释
                        if clean_rule and not clean_rule.startswith('#'):
                            unique_rules.add(clean_rule)
                    print(f"parsed: YAML 解析成功，新增 {len(unique_rules) - count_before} 条规则")
                    continue 
            except yaml.YAMLError:
                pass

            # 策略 B: 回退到纯文本处理 (如 Loyalsoldier)
            count_before = len(unique_rules)
            for line in content.splitlines():
                clean_line = line.strip()
                if clean_line and not clean_line.startswith('#'):
                    unique_rules.add(clean_line)
            print(f"parsed: 文本解析成功，新增 {len(unique_rules) - count_before} 条规则")

        except Exception as e:
            print(f"error: 处理 {url} 失败: {e}")

    return unique_rules

def generate_output(rules, output_file):
    """
    排序规则，生成元数据头部，写入文件
    """
    sorted_rules = sorted(list(rules))
    total_count = len(sorted_rules)

    # 获取 UTC+8 时间
    tz = pytz.timezone('Asia/Shanghai')
    current_time = datetime.now(tz).strftime('%Y-%m-%d %H:%M:%S UTC+8')

    # 构建头部信息
    header = f"""# Title: Waster Ads Rule
# Description: Combined and deduplicated ad-blocking rules for Clash Meta or Premium.
# --------------------------------------
# Total lines: {total_count}
# Update time: {current_time}
"""

    try:
        with open(output_file, 'w', encoding='utf8') as f:
            f.write(header + "\n")
            f.write("payload:\n")
            for rule in sorted_rules:
                f.write(f"  - '{rule}'\n")

        print(f"success: YAML 文件已生成: {output_file}，共包含 {total_count} 条规则")
    except IOError as e:
        print(f"error: 写入文件失败: {e}")

def setup_mihomo():
    """
    自动检测系统架构并下载 Mihomo 内核
    """
    system = platform.system().lower()
    machine = platform.machine().lower()

    # 简单的架构映射
    if machine in ["x86_64", "amd64"]:
        arch = "amd64"
    elif machine in ["aarch64", "arm64"]:
        arch = "arm64"
    else:
        print(f"warning: 不支持的架构 {machine}，跳过 MRS 生成")
        return None

    if system != "linux":
        # 想在本地 Windows 运行，可以扩展这里的逻辑
        print(f"warning: 本脚本目前针对 GitHub Action (Linux) 优化，当前系统 {system} 可能需要手动下载内核。")
        if system == "windows":
            return "mihomo.exe" if os.path.exists("mihomo.exe") else None

    executable_name = "mihomo"
    if os.path.exists(executable_name):
        return f"./{executable_name}"

    # 构造下载链接 (使用 MetaCubeX 官方发布源)
    # 文件名示例: mihomo-linux-amd64-v1.19.18.gz
    filename = f"mihomo-linux-{arch}-{MIHOMO_VERSION}.gz"
    url = f"https://github.com/MetaCubeX/mihomo/releases/download/{MIHOMO_VERSION}/{filename}"

    print(f"download: 正在下载 Mihomo 内核: {url}")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # 解压 .gz 文件
        with gzip.open(response.raw, 'rb') as f_in:
            with open(executable_name, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

        # 赋予执行权限
        os.chmod(executable_name, 0o755)
        print("success: Mihomo 内核准备就绪")
        return f"./{executable_name}"

    except Exception as e:
        print(f"error: 下载或解压 Mihomo 失败: {e}")
        return None

def generate_mrs(yaml_file, mrs_file, mihomo_path):
    """
    调用 mihomo 内核将 YAML 转换为 MRS
    """
    if not mihomo_path:
        print("skip: 未找到 Mihomo 内核，跳过 MRS 生成")
        return

    print(f"convert: 正在生成 MRS 文件 -> {mrs_file}")

    # 命令格式: mihomo convert-ruleset <类型> <格式> <输入> <输出>
    # 类型 domain: 因为你的规则都是域名 (+.xxx)
    # 格式 yaml: 因为输入是 yaml 文件
    cmd = [
        mihomo_path, 
        "convert-ruleset", 
        "domain", 
        "yaml", 
        yaml_file, 
        mrs_file
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"success: MRS 文件已生成: {mrs_file}")
        else:
            print(f"error: MRS 生成失败:\n{result.stderr}")
    except Exception as e:
        print(f"error: 调用内核失败: {e}")

if __name__ == "__main__":
    # 获取并生成 YAML
    rules = fetch_rules(URLS)
    generate_output(rules, OUTPUT_FILE)

    # 准备内核并生成 MRS
    mihomo_path = setup_mihomo()
    if mihomo_path:
        generate_mrs(OUTPUT_FILE, MRS_OUTPUT_FILE, mihomo_path)
