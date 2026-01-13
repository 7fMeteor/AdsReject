import urllib.request
import os
import shutil
import pytz
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# --- 全局配置 ---
OUTPUT_FILE = "ads-rule-hosts.txt"
CACHE_DIR = "download_cache"

URLS = [
    # GitHub520 加速源
    "https://raw.githubusercontent.com/521xueweihan/GitHub520/main/hosts",
    "https://anti-ad.net/domains.txt",
    "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-hosts.txt",
    "https://raw.githubusercontent.com/lingeringsound/10007_auto/master/reward"
]

# --- 标准系统回环定义 ---
DEFAULT_V4_LOCALHOST = "127.0.0.1 localhost"
DEFAULT_V6_LOCALHOST = "::1 localhost ip6-localhost ip6-loopback"

# --- 垃圾关键词清洗 ---
IGNORE_KEYWORDS = {
    'localhost', 'ip6-localhost', 'ip6-loopback', 'broadcasthost', 'hostname',
    'local', 'ip6-localnet', 'ip6-mcastprefix', 'ip6-allnodes', 'ip6-allrouters'
}

# --- 允许保留自定义IP的白名单 ---
ALLOW_CUSTOM_IP_KEYWORDS = {
    'github', 'githubusercontent', 'githubassets'
}

def download_source(url, index):
    """下载单个源文件到缓存目录"""
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR, exist_ok=True)
    filename = os.path.join(CACHE_DIR, f"source_{index}.txt")
    print(f"[-] [下载中] {url}")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(filename, 'wb') as f:
                f.write(response.read())
        print(f"[v] [下载完成] {url}")
        return filename
    except Exception as e:
        print(f"[x] [下载失败] {url}: {e}")
        return None

def process_files(file_paths):
    """解析文件，提取规则并去重"""
    top_lines = set()      # IPv4 (GitHub加速等)
    middle_lines = set()   # 0.0.0.0 屏蔽规则
    bottom_lines = set()   # IPv6 (GitHub加速等)

    seen_domains = set()   # 域名去重记录
    raw_count = 0

    for filepath in file_paths:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith(('!', '#', '[', '@@')):
                        continue

                    parts = line.split()

                    # --- 逻辑 A: 识别标准 Hosts 语法 (IP Domain) ---
                    if len(parts) >= 2 and ('.' in parts[0] or ':' in parts[0]):
                        ip = parts[0]
                        domains = parts[1:]

                        # 跳过本机回环 (后续统一添加)
                        if ip in ["127.0.0.1", "::1"]: continue

                        # 判断规则类型
                        is_block_rule = (ip == "0.0.0.0" or ip == "::")
                        is_allowed_custom = False

                        # 检查是否为允许放行的自定义IP (如GitHub)
                        if not is_block_rule:
                            for d in domains:
                                if any(k in d.lower() for k in ALLOW_CUSTOM_IP_KEYWORDS):
                                    is_allowed_custom = True
                                    break
                        
                        # 如果既不是屏蔽规则，也不是白名单规则，直接不要了。。。
                        if not is_block_rule and not is_allowed_custom:
                            continue

                        # 处理域名
                        for d in domains:
                            d = d.split('#')[0].strip()
                            if not d: continue
                            if d.lower() in IGNORE_KEYWORDS: continue
                            
                            # 全局去重 (优先保留先读取到的规则)
                            if d in seen_domains: continue
                            seen_domains.add(d)
                            raw_count += 1

                            if is_allowed_custom:
                                if ':' in ip:
                                    bottom_lines.add(f"{ip} {d}")
                                else:
                                    top_lines.add(f"{ip} {d}")
                            else:
                                middle_lines.add(f"0.0.0.0 {d}")
                                middle_lines.add(f":: {d}")

                        continue

                    # --- 逻辑 B: 识别 ABP / 纯域名语法 ---
                    domain = ""
                    if line.startswith('||'):
                        domain = line[2:].rstrip('^')
                    elif len(parts) == 1 and '.' in line:
                        domain = line

                    if domain and '/' not in domain and '*' not in domain:
                        domain = domain.split('#')[0].strip()
                        if domain.lower() in IGNORE_KEYWORDS: continue
                        
                        if domain in seen_domains: continue
                        seen_domains.add(domain)

                        # 生成双栈规则
                        middle_lines.add(f"0.0.0.0 {domain}")
                        middle_lines.add(f":: {domain}")
                        raw_count += 1

        except Exception as e:
            print(f"[!] 读取文件出错: {filepath} -> {e}")

    # 强制注入标准回环
    top_lines.add(DEFAULT_V4_LOCALHOST)
    bottom_lines.add(DEFAULT_V6_LOCALHOST)

    return top_lines, middle_lines, bottom_lines

def generate_output(top, middle, bottom, output_file):
    """写入最终 Hosts 文件"""
    total_count = len(top) + len(middle) + len(bottom)
    tz = pytz.timezone('Asia/Shanghai')
    current_time = datetime.now(tz).strftime('%Y-%m-%d %H:%M:%S UTC+8')

    header = f"""# Title: Waster Ads Hosts
# Description: Modified hosts file for system-wide ad blocking & GitHub acceleration.
# --------------------------------------
# Total lines: {total_count}
# Update time: {current_time}
"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(header + "\n")
            f.write("# [Custom IPv4 / Localhost]\n")
            f.write("\n".join(sorted(top)) + "\n\n")

            f.write("# [Blocklist / 0.0.0.0 & ::]\n")
            f.write("\n".join(sorted(middle)) + "\n\n")

            f.write("# [Custom IPv6 / Loopback]\n")
            f.write("\n".join(sorted(bottom)) + "\n")

        print(f"[完成] 文件已生成: {output_file}，去重后总行数: {total_count}")
    except IOError as e:
        print(f"[错误] 写入文件失败: {e}")
    finally:
        if os.path.exists(CACHE_DIR):
            shutil.rmtree(CACHE_DIR)

if __name__ == "__main__":
    downloaded_files = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(download_source, url, i): i for i, url in enumerate(URLS)}
        for future in futures:
            result = future.result()
            if result:
                downloaded_files.append(result)

    top, middle, bottom = process_files(downloaded_files)
    generate_output(top, middle, bottom, OUTPUT_FILE)