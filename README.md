# SCNU_pdf2ics

将华南师范大学教务系统输出的列表形式pdf转为ics文件

## 写在前面

仅用于展示想法，代码也仅仅是能跑的程度
刚好在11月14日，为了避免手动输入学期起止日期而使用的教务网的[api](http://module.scnu.edu.cn/api.php?op=jw_date)404了

## 如何使用

环境：

- 安装nodejs：测试使用nodejs版本 v12.18.4

克隆项目：

```bash
git clone git@github.com:lraty-li/SSO_Login_Of_SCNU.git
```

进入项目目录，安装依赖：

```bash
npm install
```

启动上传页面:

```bash
npm run StartPage
```

启动服务器：

```bash
npm run StartServer
```

## 已知问题

- 目前仅在win10自带日历软件测试成功
- 糟糕的异常控制
- 无事件提醒

## 感谢

- [pdf2json](https://github.com/modesty/pdf2json) 解析pdf并提取出位置信息
- [ics.js](https://github.com/nwcell/ics.js)生成ics文件
- 感谢[大佬](https://github.com/Okami-2)在我摸得正欢的时候突然发来整理pdf数据的JSON2Array.js

## "为什么不用***"

技术力低下，写了这东西的两个人都几乎不会js，这也是为什么仅用于展示。最初的设想是在用户浏览器完成整个转换。一开始并不知道nodejs并不能直接在浏览器运行。当时打包出来的pdf2json其实接近1MB但不到，只用过1Mb带宽的服务器的我觉得很大，同时pdf大约5kb。大佬没问起来之前都没回头考虑过，实际上还可以上传到CDN之类的，缺乏交流。有空会会改改，加上事件提醒。
