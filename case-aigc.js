/**
 * Load PDF, render each page to canvas, stitch vertically into one JPEG for display + download.
 */
(function () {
  "use strict";

  var PDF_URL = "assets/zpj_compressed.pdf";
  var MAX_EDGE = 8192;
  var BASE_SCALE = 2;
  var JPEG_QUALITY = 0.88;

  var statusEl = document.getElementById("case-status");
  var errorEl = document.getElementById("case-error");
  var imgEl = document.getElementById("case-stitched");
  var actionsEl = document.getElementById("case-actions");
  var downloadEl = document.getElementById("case-download");

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function showError(msg) {
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = msg;
    }
    if (statusEl) statusEl.hidden = true;
  }

  function computeScale(totalW, totalH) {
    var s = BASE_SCALE;
    var w = totalW * s;
    var h = totalH * s;
    var f = Math.min(1, MAX_EDGE / Math.max(w, h, 1));
    return s * f;
  }

  async function measurePages(pdf) {
    var totalH = 0;
    var maxW = 0;
    var n = pdf.numPages;
    for (var i = 1; i <= n; i++) {
      var page = await pdf.getPage(i);
      var vp = page.getViewport({ scale: 1 });
      totalH += vp.height;
      maxW = Math.max(maxW, vp.width);
    }
    return { totalH: totalH, maxW: maxW, numPages: n };
  }

  async function stitchPdf() {
    if (typeof pdfjsLib === "undefined") {
      showError("PDF.js 未能加载，请检查网络后刷新。");
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    setStatus("正在打开 PDF…");

    var loadingTask = pdfjsLib.getDocument({ url: PDF_URL, withCredentials: false });
    var pdf;
    try {
      pdf = await loadingTask.promise;
    } catch (e) {
      showError(
        "无法加载 PDF（常见于使用 file:// 打开页面，或路径错误）。请用本地服务器打开站点，或使用「新窗口打开 PDF」。"
      );
      return;
    }

    var meta = await measurePages(pdf);
    var scale = computeScale(meta.maxW, meta.totalH);
    setStatus("共 " + meta.numPages + " 页，缩放 " + scale.toFixed(2) + "×，开始渲染…");

    var pageDims = [];
    for (var p = 1; p <= meta.numPages; p++) {
      var page = await pdf.getPage(p);
      var vp = page.getViewport({ scale: scale });
      pageDims.push({ page: page, width: vp.width, height: vp.height, viewport: vp });
    }

    var sumH = 0;
    var maxW2 = 0;
    for (var j = 0; j < pageDims.length; j++) {
      sumH += pageDims[j].height;
      maxW2 = Math.max(maxW2, pageDims[j].width);
    }

    if (sumH > MAX_EDGE || maxW2 > MAX_EDGE) {
      showError("拼接后尺寸仍超过浏览器画布上限，请压缩 PDF 页数或分辨率后再试。");
      return;
    }

    var master = document.createElement("canvas");
    master.width = Math.ceil(maxW2);
    master.height = Math.ceil(sumH);
    var ctx = master.getContext("2d");
    if (!ctx) {
      showError("无法创建画布上下文。");
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, master.width, master.height);

    var y = 0;
    for (var k = 0; k < pageDims.length; k++) {
      var item = pageDims[k];
      setStatus("正在渲染第 " + (k + 1) + " / " + pageDims.length + " 页…");
      var c = document.createElement("canvas");
      c.width = Math.ceil(item.width);
      c.height = Math.ceil(item.height);
      var cctx = c.getContext("2d");
      await item.page.render({ canvasContext: cctx, viewport: item.viewport }).promise;
      ctx.drawImage(c, 0, y);
      y += c.height;
    }

    setStatus("正在生成图片…");

    master.toBlob(
      function (blob) {
        if (!blob) {
          showError("生成图片失败（可能画布过大）。");
          return;
        }
        var url = URL.createObjectURL(blob);
        imgEl.src = url;
        imgEl.width = master.width;
        imgEl.height = master.height;
        imgEl.hidden = false;
        downloadEl.href = url;
        downloadEl.download = "aigc-case-stitched.jpg";
        actionsEl.hidden = false;
        setStatus("已完成拼接（共 " + master.height + " px 高）。");
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  }

  stitchPdf().catch(function (err) {
    console.error(err);
    showError("处理出错：" + (err && err.message ? err.message : String(err)));
  });
})();
