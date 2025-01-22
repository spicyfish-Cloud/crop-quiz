#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Oct 20 16:30:28 2024

@author: caozhanhao
"""

import os
import json
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

# working dir.
input_folder = "./标本区作物识别"
output_file = "./images.json"


def convert_to_webp(filename):
    if filename.endswith(".jpeg") or filename.endswith(".jpg"):
        file_path = os.path.join(input_folder, filename)
        with Image.open(file_path) as img:
            # WEBP文件名
            webp_filename = os.path.splitext(filename)[0] + ".webp"
            webp_path = os.path.join(input_folder, webp_filename)
            img.save(webp_path, "WEBP")
            print(f"{filename} -> {webp_filename}")
        return webp_filename
    return None


def list_webp_files(directory):
    files = os.listdir(directory)
    webp_files = [file for file in files if file.endswith(".webp")]
    return webp_files


def save_to_json(file_list, output_file):
    # 文件保存到 json
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(file_list, f, ensure_ascii=False, indent=4)


def main():
    # 线程池
    with ThreadPoolExecutor() as executor:
        jpg_files = [
            f
            for f in os.listdir(input_folder)
            if f.endswith((".jpeg", ".jpg"))
        ]
        # 提交任务
        results = list(executor.map(convert_to_webp, jpg_files))

    # 过滤 None
    webp_files = [result for result in results if result]

    print("\n\n所有JPEG文件已转换为WEBP格式。")

    # 保存到 json
    save_to_json(webp_files, output_file)
    print(f"\n文件名已储存到 {output_file}")


if __name__ == "__main__":
    main()
