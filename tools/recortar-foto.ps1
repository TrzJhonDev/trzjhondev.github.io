param([string]$Src, [string]$Dst, [int]$OutW = 1000, [int]$Grad = 12, [int]$Erode = 2)

# Quita el fondo claro de un retrato: crece desde los bordes por píxeles claros y casi neutros
# (crema/blanco) sin cruzar saltos de color bruscos; luego erosiona y suaviza el borde.
$code = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class Cut {
  public static string Run(string src, string dst, int w, int grad, int erode) {
    using (var orig = new Bitmap(src)) {
      int h = (int)Math.Round(orig.Height * (double)w / orig.Width);
      var bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
      using (var g = Graphics.FromImage(bmp)) {
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.DrawImage(orig, 0, 0, w, h);
      }
      var data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int stride = data.Stride;
      byte[] px = new byte[stride * h];
      Marshal.Copy(data.Scan0, px, 0, px.Length);

      Func<int, int, bool> light = (x, y) => {
        int o = y * stride + x * 4; int b = px[o], gg = px[o + 1], r = px[o + 2];
        int mn = Math.Min(r, Math.Min(gg, b)), mx = Math.Max(r, Math.Max(gg, b));
        // fondo: claro, casi neutro y cálido/neutro (r >= b); la camisa es blanca azulada (b > r) y no entra
        return mn >= 150 && mx - mn <= 38 && r >= b - 3;
      };
      Func<int, int, int, int, int> diff = (x1, y1, x2, y2) => {
        int p1 = y1 * stride + x1 * 4, p2 = y2 * stride + x2 * 4;
        return Math.Abs(px[p1] - px[p2]) + Math.Abs(px[p1 + 1] - px[p2 + 1]) + Math.Abs(px[p1 + 2] - px[p2 + 2]);
      };

      bool[] bg = new bool[w * h];
      var q = new Queue<int>();
      Action<int, int> seed = (x, y) => { int i = y * w + x; if (!bg[i] && light(x, y)) { bg[i] = true; q.Enqueue(i); } };
      for (int x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
      for (int y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
      int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
      while (q.Count > 0) {
        int i = q.Dequeue(); int x = i % w, y = i / w;
        for (int k = 0; k < 4; k++) {
          int nx = x + dx[k], ny = y + dy[k];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          int j = ny * w + nx;
          if (bg[j] || !light(nx, ny) || diff(x, y, nx, ny) > grad) continue;
          bg[j] = true; q.Enqueue(j);
        }
      }

      // alfa: 0 en el fondo; se erosiona el borde para quitar el halo claro
      float[] a = new float[w * h];
      for (int i = 0; i < a.Length; i++) a[i] = bg[i] ? 0f : 1f;
      for (int pass = 0; pass < erode; pass++) {
        float[] b2 = (float[])a.Clone();
        for (int y = 1; y < h - 1; y++) for (int x = 1; x < w - 1; x++) {
          int i = y * w + x;
          if (a[i] > 0 && (a[i - 1] == 0 || a[i + 1] == 0 || a[i - w] == 0 || a[i + w] == 0)) b2[i] = 0f;
        }
        a = b2;
      }
      // se conserva solo el mayor bloque de primer plano (la persona) y se descartan motas sueltas
      int[] lab = new int[w * h]; int best = 0, bestSize = 0, nl = 0;
      for (int i0 = 0; i0 < a.Length; i0++) {
        if (a[i0] == 0 || lab[i0] != 0) continue;
        nl++; int size = 0; var qq = new Queue<int>(); qq.Enqueue(i0); lab[i0] = nl;
        while (qq.Count > 0) {
          int i = qq.Dequeue(); size++; int x = i % w, y = i / w;
          for (int k = 0; k < 4; k++) {
            int nx = x + dx[k], ny = y + dy[k];
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            int j = ny * w + nx;
            if (a[j] == 0 || lab[j] != 0) continue;
            lab[j] = nl; qq.Enqueue(j);
          }
        }
        if (size > bestSize) { bestSize = size; best = nl; }
      }
      for (int i = 0; i < a.Length; i++) if (a[i] > 0 && lab[i] != best) a[i] = 0f;

      // suavizado del borde (caja 3x3)
      float[] s = new float[w * h];
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
        float sum = 0; int n = 0;
        for (int yy = Math.Max(0, y - 1); yy <= Math.Min(h - 1, y + 1); yy++)
          for (int xx = Math.Max(0, x - 1); xx <= Math.Min(w - 1, x + 1); xx++) { sum += a[yy * w + xx]; n++; }
        s[y * w + x] = sum / n;
      }
      long fg = 0;
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
        int o = y * stride + x * 4; float al = s[y * w + x];
        px[o + 3] = (byte)Math.Round(al * 255f);
        if (al > 0.5f) fg++;
      }
      Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      bmp.Save(dst, ImageFormat.Png);
      bmp.Dispose();
      return string.Format("{0}x{1}, primer plano {2:P0}", w, h, (double)fg / (w * h));
    }
  }
}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[Cut]::Run($Src, $Dst, $OutW, $Grad, $Erode)
