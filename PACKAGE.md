# 打包说明

## 已包含的上架基础文件

- `manifest.json`
- `content.js`
- `content.css`
- `icons/`
- `README.md`
- `STORE_LISTING.md`
- `PRIVACY.md`

## 打包命令

```powershell
Compress-Archive -Path manifest.json,content.js,content.css,README.md,STORE_LISTING.md,PRIVACY.md,icons -DestinationPath ai-context.zip -Force
```

## 上传位置

Chrome Web Store Developer Dashboard:

https://chrome.google.com/webstore/devconsole/

## 还需要你准备的内容

- 商店截图
- 小宣传图 `440x280`
- 如需更高通过率，建议补充官网或支持邮箱
