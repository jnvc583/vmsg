// modal.js — ES 模块（样式已内置，会在导入时自动注入到 <head>）
// Usage: import Modal from './modal.js'

const FOCUSABLE = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])'
].join(',');

let nextModalId = 1;

// 内联默认样式（单个字符串）
const DEFAULT_CSS = `
:root{
  --overlay-bg: rgba(0,0,0,0.55);
  --modal-bg: #fff;
  --radius: 8px;
  --max-width: 640px;
  --gap: 16px;
  --accent: #246bfd;
  --text: #111;
  --dock-size: 56px;
  --dock-gap: 8px;
}

/* 基本重置/容器（模块会自动注入，不依赖外部样式） */
.modal-overlay{
  position:fixed;
  inset:0;
  background:var(--overlay-bg);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
  animation:overlay-in .18s ease;
}
@keyframes overlay-in{ from{opacity:0} to{opacity:1} }

.modal-dialog{
  background:var(--modal-bg);
  border-radius:var(--radius);
  max-width:var(--max-width);
  width:calc(100% - 48px);
  box-shadow:0 10px 30px rgba(0,0,0,0.25);
  transform:translateY(8px);
  animation:dialog-in .22s cubic-bezier(.2,.9,.3,1);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  transition:width .18s ease, height .18s ease, transform .18s ease, left .12s ease, top .12s ease;
  position:relative;
}
@keyframes dialog-in{ from{opacity:0; transform:translateY(18px) scale(.995)} to{opacity:1; transform:translateY(0) scale(1)} }

.modal-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:16px;
  border-bottom:1px solid #eee;
  background:transparent;
}
.modal-title{ margin:0; font-size:1.05rem; font-weight:600; }
.modal-close{
  background:transparent; border:0; padding:6px; margin-left:12px; cursor:pointer; font-size:16px; color:#666;
}

.modal-content{ padding:16px; max-height:70vh; overflow:auto; }
.modal-footer{ display:flex; justify-content:flex-end; gap:12px; padding:12px 16px 16px; border-top:1px solid #eee; }

.btn{ padding:8px 12px; border-radius:6px; border:1px solid #d0d5dd; background:#fff; cursor:pointer; }
.btn-primary{ background:var(--accent); color:white; border-color:transparent; }
.btn-danger{ background:#e74c3c; color:white; border-color:transparent; }

/* Mac 风格标题栏（traffic lights）和可拖拽 */
.mac-titlebar{
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px 12px;
  border-bottom:1px solid #e9e9ea;
  background:linear-gradient(#f7f7f8, #f3f3f4);
  -webkit-user-select:none; user-select:none;
  cursor:grab;
}
.mac-titlebar:active { cursor:grabbing; }

.mac-left{ display:flex; align-items:center; gap:8px; margin-right:8px; }

/* traffic lights */
.mac-btn {
  width:12px; height:12px; border-radius:50%;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.12);
  cursor:pointer; border: 1px solid rgba(0,0,0,0.06); padding:0;
}
.mac-btn.red { background:#ff5f57; }
.mac-btn.yellow { background:#ffbd2e; }
.mac-btn.green { background:#28c840; }

/* 标题 */
.mac-title { flex:1; text-align:center; font-weight:600; color:#222; margin:0; font-size:0.95rem; pointer-events:none; }

/* 最小化：隐藏内容与 footer（当真实最小化时 overlay 会被移除并显示 dock 图标） */
.mac-minimized .modal-content, .mac-minimized .modal-footer { display:none; }
.mac-minimized .modal-dialog { width:320px; max-width:80%; height:auto; }

/* 最大化样式 */
.mac-maximized .modal-dialog { width:calc(100% - 36px); height:calc(100% - 48px); max-width:none; border-radius:8px; }

/* 拖拽时的阴影/在最上层 */
.modal-dialog.dragging {
  box-shadow:0 18px 40px rgba(0,0,0,0.35);
  transition: none;
  z-index: 2000;
  border-radius:10px;
}

/* Dock（停靠区）—— 固定在右下角，可放多个图标 */
#modal-dock {
  position:fixed;
  right:16px;
  bottom:16px;
  display:flex;
  gap:var(--dock-gap);
  align-items:end;
  z-index:1200;
  pointer-events:none;
}
.modal-dock-item{
  width:var(--dock-size);
  height:var(--dock-size);
  background:rgba(255,255,255,0.98);
  border-radius:10px;
  box-shadow:0 6px 18px rgba(0,0,0,0.18);
  display:flex;
  align-items:center;
  justify-content:center;
  flex-direction:column;
  font-size:12px;
  padding:6px;
  cursor:pointer;
  pointer-events:auto;
  transition: transform .12s ease, opacity .12s ease;
  user-select:none;
}
.modal-dock-item:hover { transform:translateY(-6px); }
.modal-dock-icon {
  width:28px; height:28px; border-radius:6px; background:var(--accent); color:white; display:flex; align-items:center; justify-content:center; font-weight:600;
}

/* 小屏幕适配 */
@media (max-width:480px){
  .modal-dialog{ width: calc(100% - 24px); border-radius:10px; margin:12px; position:relative; left:auto; top:auto; transform:none; }
  #modal-dock { right:8px; bottom:8px; }
}

/* focus outlines */
.modal-dialog:focus { outline: none; }
.modal-close:focus, .mac-btn:focus { outline: 2px solid rgba(36,107,253,0.18); border-radius:50%; }

/* 隐藏方式用于淡出动画 */
.modal-overlay.hidden { opacity:0; pointer-events:none; transition:opacity .18s ease; }
`;

// 注入样式（只注入一次）
(function ensureStyles() {
    if (typeof window === 'undefined') return;
    if (window.__modal_styles_injected) return;
    const style = document.createElement('style');
    style.setAttribute('data-modal-default-styles', 'true');
    style.textContent = DEFAULT_CSS;
    document.head.appendChild(style);
    window.__modal_styles_injected = true;
})();

export default class Modal {
    constructor({ title = '', html = '', closable = true, footer = null, style = 'default' } = {}) {
        this.id = `modal-${nextModalId++}`;
        this.title = title;
        this.html = html;
        this.closable = closable;
        this.footer = Array.isArray(footer) ? footer : null;
        this.style = style; // 'default' | 'mac'
        this.previouslyFocused = null;
        this.isOpen = false;
        this._dragging = false;
        this._position = { left: null, top: null };
        this._minimized = false;
        this._maximized = false;
        this._build();
    }

    _build() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.setAttribute('role', 'presentation');
        this.overlay.dataset.modalId = this.id;

        this.dialog = document.createElement('div');
        this.dialog.className = 'modal-dialog';
        this.dialog.setAttribute('role', 'dialog');
        this.dialog.setAttribute('aria-modal', 'true');
        this.dialog.setAttribute('aria-hidden', 'true');
        this.dialog.setAttribute('tabindex', '-1');
        this.dialog.dataset.modalId = this.id;

        // header
        if (this.style === 'mac') {
            const titlebar = document.createElement('div');
            titlebar.className = 'mac-titlebar';
            titlebar.dataset.dragHandle = 'true';

            const left = document.createElement('div');
            left.className = 'mac-left';

            const btnClose = document.createElement('button');
            btnClose.className = 'mac-btn red';
            btnClose.type = 'button';
            btnClose.setAttribute('aria-label', '关闭窗口');
            btnClose.title = '关闭';
            btnClose.addEventListener('click', () => this.close());

            const btnMin = document.createElement('button');
            btnMin.className = 'mac-btn yellow';
            btnMin.type = 'button';
            btnMin.setAttribute('aria-label', '最小化窗口');
            btnMin.title = '最小化';
            btnMin.addEventListener('click', () => this.minimize());

            const btnMax = document.createElement('button');
            btnMax.className = 'mac-btn green';
            btnMax.type = 'button';
            btnMax.setAttribute('aria-label', '最大化或恢复窗口');
            btnMax.title = '最大化/恢复';
            btnMax.addEventListener('click', () => this.toggleMaximize());

            left.appendChild(btnClose);
            left.appendChild(btnMin);
            left.appendChild(btnMax);

            const titleEl = document.createElement('div');
            titleEl.className = 'mac-title';
            titleEl.textContent = this.title;

            titlebar.appendChild(left);
            titlebar.appendChild(titleEl);

            this.titlebar = titlebar;
            this.dialog.appendChild(titlebar);
        } else {
            const header = document.createElement('div');
            header.className = 'modal-header';
            const titleEl = document.createElement('h2');
            titleEl.className = 'modal-title';
            titleEl.textContent = this.title;
            titleEl.id = `${this.id}-title`;
            this.dialog.setAttribute('aria-labelledby', titleEl.id);
            header.appendChild(titleEl);
            if (this.closable) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'modal-close';
                closeBtn.type = 'button';
                closeBtn.setAttribute('aria-label', '关闭弹窗');
                closeBtn.innerHTML = '✕';
                closeBtn.addEventListener('click', () => this.close());
                header.appendChild(closeBtn);
            }
            this.titlebar = header;
            this.dialog.appendChild(header);
        }

        const content = document.createElement('div');
        content.className = 'modal-content';
        if (typeof this.html === 'string') content.innerHTML = this.html;
        else if (this.html instanceof Node) content.appendChild(this.html);
        this.content = content;
        this.dialog.appendChild(content);

        if (this.footer) {
            const footerEl = document.createElement('div');
            footerEl.className = 'modal-footer';
            this.footer.forEach(btn => {
                const b = document.createElement('button');
                b.type = 'button';
                b.textContent = btn.text || '按钮';
                b.className = 'btn ' + (btn.className || '');
                b.addEventListener('click', (e) => {
                    if (typeof btn.onClick === 'function') btn.onClick(e, this);
                });
                footerEl.appendChild(b);
            });
            this.footerEl = footerEl;
            this.dialog.appendChild(footerEl);
        }
        
        this.overlay.appendChild(this.dialog);
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        document.body.appendChild(this.overlay);
        document.body.classList.add('modal-open');
        this.dialog.setAttribute('aria-hidden', 'false');

        this._onKeydown = (e) => this._handleKeydown(e);
        this._onOverlayMouseDown = (e) => this._handleOverlayMouseDown(e);
        document.addEventListener('keydown', this._onKeydown);
        this.overlay.addEventListener('mousedown', this._onOverlayMouseDown);

        if (this.style === 'mac') this._enableDragging();

        this._centerDialog();

        const first = this._focusableNodes()[0] || this.dialog;
        setTimeout(() => { first.focus?.(); }, 10);
    }

    close(result) {
        if (!this.isOpen) return;
        this.isOpen = false;

        document.removeEventListener('keydown', this._onKeydown);
        this.overlay.removeEventListener('mousedown', this._onOverlayMouseDown);
        this._disableDragging();

        if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
        document.body.classList.remove('modal-open');
        this.dialog.setAttribute('aria-hidden', 'true');

        try {
            if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
                this.previouslyFocused.focus();
            }
        } catch (e) { }

        if (typeof this.onClose === 'function') this.onClose(result);
    }

    minimize() {
        if (!this.isOpen) return;
        if (this._minimized) return;
        this._minimized = true;

        const dock = Modal._ensureDock();
        const item = document.createElement('div');
        item.className = 'modal-dock-item';
        item.title = this.title || '窗口';

        const badge = document.createElement('div');
        badge.className = 'modal-dock-icon';
        badge.textContent = (this.title && this.title.trim()[0]) ? this.title.trim()[0].toUpperCase() : '•';

        const label = document.createElement('div');
        label.style.fontSize = '11px';
        label.style.marginTop = '4px';
        label.textContent = (this.title && this.title.length > 12) ? this.title.slice(0, 10) + '…' : this.title;

        item.appendChild(badge);
        item.appendChild(label);

        item.addEventListener('click', () => {
            if (item.parentNode) item.parentNode.removeChild(item);
            this._minimized = false;
            this.open();
        });

        this._dockItem = item;
        dock.appendChild(item);

        // 隐藏 overlay（淡出）
        this.overlay.classList.add('hidden');
        setTimeout(() => {
            if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
            document.body.classList.remove('modal-open');
            this.isOpen = false;
            try { document.body.focus(); } catch (e) { }
        }, 200);
    }

    toggleMaximize() {
        if (this._maximized) this._restoreFromMax();
        else this._maximize();
    }
    _maximize() {
        this._maximized = true;
        this.overlay.classList.add('mac-maximized-wrapper');
        this.dialog.classList.add('mac-maximized');
        this.dialog.style.left = '';
        this.dialog.style.top = '';
        this.dialog.style.position = 'relative';
    }
    _restoreFromMax() {
        this._maximized = false;
        this.overlay.classList.remove('mac-maximized-wrapper');
        this.dialog.classList.remove('mac-maximized');
        this.dialog.style.position = 'absolute';
        if (this._position.left !== null) this.dialog.style.left = this._position.left + 'px';
        if (this._position.top !== null) this.dialog.style.top = this._position.top + 'px';
    }

    _handleKeydown(e) {
        if (e.key === 'Escape') {
            if (this.closable) { this.close(); }
            return;
        }
        if (e.key === 'Tab') {
            this._maintainFocus(e);
        }
    }

    _focusableNodes() {
        return Array.from(this.dialog.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
    }

    _maintainFocus(e) {
        const nodes = this._focusableNodes();
        if (!nodes.length) { e.preventDefault(); return; }
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (!this.dialog.contains(document.activeElement)) { first.focus(); e.preventDefault(); return; }
        if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
        else if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    }

    _handleOverlayMouseDown(e) {
        if (e.target === this.overlay) this.close();
    }

    _enableDragging() {
        if (!this.titlebar) return;
        this.dialog.style.position = 'absolute';
        this._centerDialog();

        this._onPointerDown = (e) => {
            const target = e.target;
            if (target.closest && target.closest('.mac-btn')) return;
            this._dragging = true;
            this.dialog.classList.add('dragging');
            this.dialog.setPointerCapture?.(e.pointerId);
            this._startPointer = { x: e.clientX, y: e.clientY };
            const rect = this.dialog.getBoundingClientRect();
            const overlayRect = this.overlay.getBoundingClientRect();
            this._startDialog = { left: rect.left - overlayRect.left, top: rect.top - overlayRect.top };

            this._onPointerMove = (ev) => {
                if (!this._dragging) return;
                const dx = ev.clientX - this._startPointer.x;
                const dy = ev.clientY - this._startPointer.y;
                const left = Math.round(this._startDialog.left + dx);
                const top = Math.round(this._startDialog.top + dy);
                const pad = 12;
                const maxLeft = Math.max(0, overlayRect.width - rect.width - pad);
                const maxTop = Math.max(0, overlayRect.height - rect.height - pad);
                const clampedLeft = Math.min(Math.max(pad, left), maxLeft);
                const clampedTop = Math.min(Math.max(pad, top), maxTop);
                this.dialog.style.left = clampedLeft + 'px';
                this.dialog.style.top = clampedTop + 'px';
                this._position.left = clampedLeft;
                this._position.top = clampedTop;
            };
            this._onPointerUp = (ev) => {
                this._dragging = false;
                this.dialog.classList.remove('dragging');
                try { this.dialog.releasePointerCapture?.(ev.pointerId); } catch (e) { }
                window.removeEventListener('pointermove', this._onPointerMove);
                window.removeEventListener('pointerup', this._onPointerUp);
            };
            window.addEventListener('pointermove', this._onPointerMove);
            window.addEventListener('pointerup', this._onPointerUp);
        };

        this.titlebar.addEventListener('pointerdown', this._onPointerDown);
    }

    _disableDragging() {
        if (!this.titlebar) return;
        if (this._onPointerDown) this.titlebar.removeEventListener('pointerdown', this._onPointerDown);
        window.removeEventListener('pointermove', this._onPointerMove);
        window.removeEventListener('pointerup', this._onPointerUp);
        this._dragging = false;
        this.dialog.classList.remove('dragging');
    }

    _centerDialog() {
        if (!this.overlay.parentNode) {
            this.overlay.style.visibility = 'hidden';
            document.body.appendChild(this.overlay);
        }
        const overlayRect = this.overlay.getBoundingClientRect();
        const rect = this.dialog.getBoundingClientRect();
        const left = Math.max(12, Math.round((overlayRect.width - rect.width) / 2));
        const top = Math.max(12, Math.round((overlayRect.height - rect.height) / 2));
        this.dialog.style.position = 'absolute';
        this.dialog.style.left = left + 'px';
        this.dialog.style.top = top + 'px';
        this.overlay.style.visibility = '';
    }

    onClosed(cb) { this.onClose = cb; return this; }

    static _ensureDock() {
        let dock = document.getElementById('modal-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'modal-dock';
            document.body.appendChild(dock);
        }
        return dock;
    }
}
