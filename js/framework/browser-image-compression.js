/**
 * Browser Image Compression
 * v2.0.2
 * by Donald <donaldcwl@gmail.com>
 * https://github.com/Donaldcwl/browser-image-compression
 */
/* eslint-disable prefer-destructuring, no-await-in-loop */

function t(t, e, n) {
    const a = t.getContext("2d");
    return a.fillStyle = "#fff", a.fillRect(0, 0, e, n), a.drawImage(t, 0, 0, e, n), a
}
async function e(e, n, a, i, r, s, o, l) {
    let d, h = e;
    const c = document.createElement("canvas");
    c.width = n, c.height = a;
    const u = c.getContext("2d");
    if (o && (d = function(t, e) {
            let n;
            return "image/jpeg" === t ? (n = e.split(",")[1], atob(n)) : (console.error("not implemented"), "")
        }(h.type, h.src), h = new Image, "undefined" != typeof createImageBitmap ? await
        async function() {
            const e = new Blob([d], {
                type: t
            });
            h = await createImageBitmap(e, {
                premultiplyAlpha: "none",
                colorSpaceConversion: "none"
            })
        }() : h.src = e.src), l && s > r ? u.drawImage(h, 0, 0) : s < r ? (u.drawImage(h, 0, 0, s, r), t(c, n, a)) : u.drawImage(h, 0, 0, n, a), i > 1) {
        const t = Math.ceil(Math.log2(s / n) / Math.log2(i));
        if (t > 0) {
            let e = s,
                r = a;
            u.globalCompositeOperation = "copy";
            for (let s = 0; s < t; s++) {
                const o = Math.floor(e / i),
                    l = Math.floor(r / i);
                u.drawImage(c, 0, 0, e, r, 0, 0, o, l), e = o, r = l
            }
        }
    }
    return c
}
async function n(t, n) {
    const a = t.width,
        i = t.height;
    let r, s;
    const {
        maxWidth: o,
        maxHeight: l,
        maxSize: d,
        exifOrientation: h
    } = n, c = a > i;
    if (h > 4) {
        const e = document.createElement("canvas");
        e.width = i, e.height = a;
        const n = e.getContext("2d");
        ! function(t, e, n, a, i) {
            const r = e.getContext("2d");
            switch (i) {
                case 2:
                    r.translate(n, 0), r.scale(-1, 1);
                    break;
                case 3:
                    r.translate(n, a), r.rotate(Math.PI);
                    break;
                case 4:
                    r.translate(0, a), r.scale(1, -1);
                    break;
                case 5:
                    r.rotate(.5 * Math.PI), r.scale(1, -1);
                    break;
                case 6:
                    r.rotate(.5 * Math.PI), r.translate(0, -a);
                    break;
                case 7:
                    r.rotate(.5 * Math.PI), r.translate(n, -a), r.scale(-1, 1);
                    break;
                case 8:
                    r.rotate(-.5 * Math.PI), r.translate(-n, 0)
            }
            r.drawImage(t, 0, 0)
        }(t, e, a, i, h), t = e
    }
    const u = t.width,
        m = t.height;
    o && l ? (r = o, s = l) : o ? (r = o, s = m * o / u) : l ? (s = l, r = u * l / m) : (r = u, s = m);
    let g = u,
        f = m;
    if (c && u > r || !c && m > s) c ? (f = m * r / u, g = r) : (g = u * s / m, f = s);
    else if (c && m > s || !c && u > r) c ? (g = u * s / m, f = s) : (f = m * r / u, g = r);
    const p = Math.floor(g),
        b = Math.floor(f),
        w = n.signal;
    let y = t;
    const v = n.maxIteration || 10,
        x = n.sharpen || 0;
    if (n.resize || (p < u || b < m)) y = await e(t, p, b, n.pica || 2, u, m, n.useWebWorker, n.preserveExif);
    const E = document.createElement("canvas");
    E.width = p, E.height = b;
    const M = E.getContext("2d");
    if (M.drawImage(y, 0, 0, p, b), x > 0) {
        const t = document.createElement("canvas");
        t.width = p, t.height = b;
        const e = t.getContext("2d"),
            n = [0, -1 * x, 0, -1 * x, 4 * x + 1, -1 * x, 0, -1 * x, 0];
        e.putImageData(function(t, e, n) {
            const a = t.data,
                i = e.data,
                r = a.length;
            for (let s = 0; s < r; s++)
                if ((s + 1) % 4) {
                    const r = 3 * Math.floor(s / 12),
                        o = s % 12 % 4,
                        l = Math.floor(s % 12 / 4),
                        d = Math.floor(s / 4);
                    let h = 0;
                    for (let t = 0; t < 3; t++)
                        for (let e = 0; e < 3; e++) {
                            const s = 4 * (d + (t - 1) * n + (e - 1));
                            h += a[s] * n[3 * t + e]
                        }
                    i[s] = h
                } else i[s] = a[s];
            return e
        }(M.getImageData(0, 0, p, b), e.createImageData(p, b), n), 0, 0)
    }
    let R = E;
    if (d) {
        let t = 1,
            e = 0;
        const a = function() {
                const t = document.createElement("canvas");
                return t.width = E.width, t.height = E.height, t.getContext("2d").drawImage(E, 0, 0), t
            }(),
            i = a.getContext("2d");
        for (; e < v;) {
            if (w) try {
                w.throwIfAborted()
            } catch (t) {
                throw t
            }
            R = a;
            const r = await async function(t, e) {
                const n = t.toDataURL(e.fileType, e.initialQuality);
                return new File([await(await fetch(n)).blob()], e.fileName, {
                    type: e.fileType
                })
            }(a, n);
            if (r.size / 1024 / 1024 < d) break;
            const s = function(t, e) {
                let n;
                const a = 1.5 * t.size / 1024 / 1024,
                    i = .75 * e;
                return n = a > i ? i / a : .95, [t.size / 1024 / 1024 / n, n]
            }(r, d);
            i.clearRect(0, 0, a.width, a.height), i.drawImage(E, 0, 0, a.width * Math.sqrt(s[1]), a.height * Math.sqrt(s[1])), t = s[1], e++
        }
    }
    const S = await async function(t, e) {
        const n = t.toDataURL(e.fileType, e.initialQuality);
        return new File([await(await fetch(n)).blob()], e.fileName, {
            type: e.fileType
        })
    }(R, n);
    return S.size > t.size && (console.warn("notice: the file size is not smaller than original file", S.size, t.size), S = t), S
}
async function a(t, a) {
    if (a.signal) try {
        a.signal.throwIfAborted()
    } catch (t) {
        throw t
    }
    let i;
    const r = a.maxSizeMB || a.maxSize,
        s = { ...a,
            maxSize: r,
            fileName: t.name,
            fileType: a.fileType || t.type
        };
    if (!(t instanceof Blob || t instanceof File)) throw new Error("The file given is not an instance of Blob or File");
    if (!/^image/.test(t.type)) throw new Error("The file given is not an image");
    if ("undefined" == typeof Worker && s.useWebWorker) try {
        i = await e(s)
    } catch (e) {
        i = t
    } else i = t;
    const o = await
    function(t) {
        return new Promise(((e, n) => {
            const a = new FileReader;
            a.onload = () => e(a.result), a.onerror = n, a.readAsDataURL(t)
        }))
    }(i), l = document.createElement("img");
    l.src = o;
    const d = new Promise(((t, e) => {
        l.onload = () => t(l), l.onerror = e
    }));
    if (s.signal) {
        const t = new Promise(((t, e) => {
            s.signal.onabort = () => e(s.signal.reason)
        }));
        await Promise.race([d, t])
    } else await d;
    s.exifOrientation = function(t) {
        const e = function(t) {
            const e = new DataView(t);
            if (65496 !== e.getUint16(0, !1)) return -1;
            const n = e.byteLength;
            let a = 2;
            for (; a < n;) {
                if (65505 === e.getUint16(a, !1)) {
                    if (a + 2 + 4 > n) break;
                    if (1165519206 === e.getUint32(a + 2, !1)) return a + 2 + 6
                }
                a += 2;
                const i = e.getUint16(a, !1);
                if (i > 65536) break;
                a += i
            }
            return -1
        }(function(t) {
            const e = atob(t.split(",")[1]);
            let n = e.length;
            const a = new Uint8Array(n);
            for (; n--;) a[n] = e.charCodeAt(n);
            return a.buffer
        }(t).split(",")[1]);
        if (-1 === e) return -1;
        const n = new DataView(t);
        let a = e;
        const i = n.getUint16(a, !1);
        a += 2;
        for (let t = 0; t < i; t++)
            if (274 === n.getUint16(a + 12 * t, !1)) return n.getUint16(a + 12 * t + 8, !1);
        return -1
    }(o);
    const h = await n(l, s);
    return h.type = t.type, h
}
var E = a;
export { E as default };
