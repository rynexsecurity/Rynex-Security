'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './ImageInsertBar.module.css';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (newValue: string) => void;
}

/* ── helper lists ── */
const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Grey', hex: '#718096' },
  { name: 'Red', hex: '#e53e3e' },
  { name: 'Orange', hex: '#dd6b20' },
  { name: 'Yellow', hex: '#ecc94b' },
  { name: 'Green', hex: '#38a169' },
  { name: 'Blue', hex: '#3182ce' },
  { name: 'Purple', hex: '#805ad5' },
  { name: 'Pink', hex: '#d53f8c' },
  { name: 'White', hex: '#ffffff' }
];

const HIGHLIGHTS = [
  { name: 'Light Grey', hex: '#e2e8f0' },
  { name: 'Light Red', hex: '#fed7d7' },
  { name: 'Light Orange', hex: '#feebc8' },
  { name: 'Light Yellow', hex: '#fefcbf' },
  { name: 'Light Green', hex: '#c6f6d5' },
  { name: 'Light Blue', hex: '#bee3f8' },
  { name: 'Light Purple', hex: '#e9d8fd' },
  { name: 'Light Pink', hex: '#fed7e2' },
  { name: 'Clear Highlight', hex: '#ffffff' }
];

const EMOJIS = [
  '😀', '😂', '😍', '👍', '🎉', '🔥', 
  '🚀', '💻', '🔒', '🛡️', '💡', '📌', 
  '✅', '❌', '⚠️', '👀', '🌟', '👏',
  '🙌', '❤️', '🤔', '💬', '📢', '🌍'
];

/* ── helpers ── */
function insertAround(
  ta: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
  onChange: (v: string) => void
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.slice(start, end) || placeholder;
  const newVal = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
  onChange(newVal);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

function insertBlock(
  ta: HTMLTextAreaElement,
  block: string,
  onChange: (v: string) => void
) {
  const pos = ta.selectionStart;
  const before = ta.value.slice(0, pos);
  const after = ta.value.slice(pos);
  const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
  const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
  const newVal = before + prefix + block + suffix + after;
  onChange(newVal);
  requestAnimationFrame(() => {
    ta.focus();
    const cur = pos + prefix.length + block.length + suffix.length;
    ta.setSelectionRange(cur, cur);
  });
}

/* ── component ── */
export default function MarkdownToolbar({ textareaRef, onContentChange }: Props) {
  /* image modal state */
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imgTab, setImgTab] = useState<'url' | 'upload'>('url');
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [imgAlign, setImgAlign] = useState<'left' | 'center' | 'right'>('center');
  const [imgPreviewErr, setImgPreviewErr] = useState(false);
  /* upload state */
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* link modal state */
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  /* dropdown states */
  const [openDropdown, setOpenDropdown] = useState<'image' | 'heading' | 'color' | 'highlight' | 'emoji' | 'more' | null>(null);
  const [currentFormat, setCurrentFormat] = useState('Main text 2');
  const [activeAlign, setActiveAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  /* undo/redo history states */
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const ta = () => textareaRef.current!;

  /* setup click outside to close dropdowns */
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenDropdown(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  /* capture manual edits for undo/redo */
  useEffect(() => {
    const taEl = textareaRef.current;
    if (!taEl) return;

    if (historyRef.current.length === 0) {
      historyRef.current = [taEl.value];
      historyIndexRef.current = 0;
    }

    let timeoutId: any;
    const handleInput = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentVal = taEl.value;
        const hist = historyRef.current;
        const idx = historyIndexRef.current;
        if (hist[idx] !== currentVal) {
          const newHist = hist.slice(0, idx + 1);
          newHist.push(currentVal);
          historyRef.current = newHist;
          historyIndexRef.current = newHist.length - 1;
        }
      }, 400);
    };

    taEl.addEventListener('input', handleInput);
    return () => {
      taEl.removeEventListener('input', handleInput);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [textareaRef]);

  const saveToHistory = (newVal: string) => {
    const hist = historyRef.current;
    const idx = historyIndexRef.current;
    if (hist[idx] === newVal) return;
    const newHist = hist.slice(0, idx + 1);
    newHist.push(newVal);
    historyRef.current = newHist;
    historyIndexRef.current = newHist.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevVal = historyRef.current[historyIndexRef.current];
      onContentChange(prevVal);
      requestAnimationFrame(() => {
        ta().focus();
      });
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextVal = historyRef.current[historyIndexRef.current];
      onContentChange(nextVal);
      requestAnimationFrame(() => {
        ta().focus();
      });
    }
  };

  const executeAround = (before: string, after: string, placeholder: string) => {
    insertAround(ta(), before, after, placeholder, (newVal) => {
      onContentChange(newVal);
      saveToHistory(newVal);
    });
  };

  const executeBlock = (block: string) => {
    insertBlock(ta(), block, (newVal) => {
      onContentChange(newVal);
      saveToHistory(newVal);
    });
  };

  /* build the final markdown/html for the image */
  const buildImageMarkdown = (url: string, alt: string, align: 'left' | 'center' | 'right') => {
    const safeAlt = alt.trim() || 'image';
    const safeUrl = url.trim();
    if (align === 'center') return `<div style="text-align:center">\n\n![${safeAlt}](${safeUrl})\n\n</div>`;
    if (align === 'right')  return `<div style="text-align:right">\n\n![${safeAlt}](${safeUrl})\n\n</div>`;
    return `![${safeAlt}](${safeUrl})`;
  };

  /* active image URL depends on which tab */
  const activeUrl = imgTab === 'upload' ? uploadedUrl : imgUrl;

  const handleInsertImage = () => {
    if (!activeUrl.trim()) return;
    insertBlock(ta(), buildImageMarkdown(activeUrl, imgAlt, imgAlign), onContentChange);
    closeImageModal();
  };

  const openImageModal = () => {
    setImgTab('url');
    setImgUrl('');
    setImgAlt('');
    setImgAlign('center');
    setImgPreviewErr(false);
    setUploadedUrl('');
    setUploadErr('');
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setUploading(false);
  };

  const handleImageDropdownAction = (tab: 'url' | 'upload') => {
    setImgTab(tab);
    setImgUrl('');
    setImgAlt('');
    setImgAlign('center');
    setImgPreviewErr(false);
    setUploadedUrl('');
    setUploadErr('');
    setImageModalOpen(true);
    setOpenDropdown(null);
  };

  /* file upload handler */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr('');
    setUploadedUrl('');
    setImgPreviewErr(false);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/upload/blog-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedUrl(data.url);
    } catch (err: any) {
      setUploadErr(err.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const md = `[${linkText.trim() || linkUrl.trim()}](${linkUrl.trim()})`;
    const pos = ta().selectionStart;
    const before = ta().value.slice(0, pos);
    const after  = ta().value.slice(pos);
    onContentChange(before + md + after);
    setLinkModalOpen(false);
  };

  /* actions */
  const applyHeading = (level: string) => {
    const taEl = ta();
    const start = taEl.selectionStart;
    const end = taEl.selectionEnd;
    const value = taEl.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;

    const currentLine = value.slice(lineStart, lineEnd);
    const cleanLine = currentLine.replace(/^#+\s*/, '');

    let newlinePrefix = '';
    if (level === 'H1') newlinePrefix = '# ';
    else if (level === 'H2') newlinePrefix = '## ';
    else if (level === 'H3') newlinePrefix = '### ';

    const newLine = newlinePrefix + cleanLine;
    const newVal = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
    onContentChange(newVal);
    saveToHistory(newVal);

    setCurrentFormat(
      level === 'H1' ? 'Heading 1' : 
      level === 'H2' ? 'Heading 2' : 
      level === 'H3' ? 'Heading 3' : 
      level === 'M1' ? 'Main text 1' : 'Main text 2'
    );

    requestAnimationFrame(() => {
      taEl.focus();
      taEl.setSelectionRange(lineStart + newlinePrefix.length, lineStart + newLine.length);
    });
    setOpenDropdown(null);
  };

  const applyAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    const taEl = ta();
    const start = taEl.selectionStart;
    const end = taEl.selectionEnd;
    
    let before = '';
    let after = '';
    if (align !== 'left') {
      before = `<div style="text-align: ${align}">\n`;
      after = '\n</div>';
    } else {
      before = '<div style="text-align: left">\n';
      after = '\n</div>';
    }

    insertAround(taEl, before, after, 'aligned text', (newVal) => {
      onContentChange(newVal);
      saveToHistory(newVal);
    });
    setActiveAlign(align);
  };

  const insertEmoji = (emoji: string) => {
    const taEl = ta();
    const pos = taEl.selectionStart;
    const newVal = taEl.value.slice(0, pos) + emoji + taEl.value.slice(pos);
    onContentChange(newVal);
    saveToHistory(newVal);
    requestAnimationFrame(() => {
      taEl.focus();
      taEl.setSelectionRange(pos + emoji.length, pos + emoji.length);
    });
    setOpenDropdown(null);
  };

  const insertTable = () => {
    const tableTemplate = `\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
    executeBlock(tableTemplate);
  };

  const insertLocation = () => {
    const loc = prompt('Enter location (e.g. London, UK):');
    if (loc && loc.trim()) {
      executeBlock(`📍 **${loc.trim()}**`);
    }
  };

  const applyDropCap = () => {
    const taEl = ta();
    const start = taEl.selectionStart;
    const end = taEl.selectionEnd;
    const selected = taEl.value.slice(start, end);
    const letter = selected.length === 1 ? selected : 'A';
    const snippet = `<span class="drop-cap">${letter}</span>`;
    const before = taEl.value.slice(0, start);
    const after = taEl.value.slice(end);
    const newVal = before + snippet + after;
    onContentChange(newVal);
    saveToHistory(newVal);
    requestAnimationFrame(() => {
      taEl.focus();
      taEl.setSelectionRange(before.length + snippet.length, before.length + snippet.length);
    });
    setOpenDropdown(null);
  };

  /* preview url shown in the modal */
  const previewUrl = activeUrl;

  return (
    <>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar} role="toolbar" aria-label="Markdown editor toolbar">
        
        {/* 1. Image Dropdown */}
        <div className={styles.dropdownWrapper} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.dropdownToggle}
            onClick={() => setOpenDropdown(openDropdown === 'image' ? null : 'image')}
            title="Insert Image"
          >
            <i className="fas fa-image" style={{ color: 'var(--portal-accent)' }} />
            <i className={`fas fa-chevron-down ${styles.dropdownChevron}`} />
          </button>
          {openDropdown === 'image' && (
            <div className={styles.dropdownMenu}>
              <button type="button" className={styles.dropdownItem} onClick={() => handleImageDropdownAction('upload')}>
                <i className="fas fa-upload" style={{ marginRight: '6px' }} /> Upload from device
              </button>
              <button type="button" className={styles.dropdownItem} onClick={() => handleImageDropdownAction('url')}>
                <i className="fas fa-link" style={{ marginRight: '6px' }} /> Insert from URL
              </button>
            </div>
          )}
        </div>

        {/* 2. Format / Heading Dropdown */}
        <div className={styles.dropdownWrapper} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.dropdownToggle}
            onClick={() => setOpenDropdown(openDropdown === 'heading' ? null : 'heading')}
            title="Heading Style"
            style={{ minWidth: '100px', justifyContent: 'space-between' }}
          >
            <span>{currentFormat}</span>
            <i className={`fas fa-chevron-down ${styles.dropdownChevron}`} />
          </button>
          {openDropdown === 'heading' && (
            <div className={styles.dropdownMenu}>
              <button type="button" className={styles.dropdownItem} onClick={() => applyHeading('M1')}>Main text 1</button>
              <button type="button" className={styles.dropdownItem} onClick={() => applyHeading('M2')}>Main text 2</button>
              <button type="button" className={styles.dropdownItem} onClick={() => applyHeading('H1')}>Heading 1</button>
              <button type="button" className={styles.dropdownItem} onClick={() => applyHeading('H2')}>Heading 2</button>
              <button type="button" className={styles.dropdownItem} onClick={() => applyHeading('H3')}>Heading 3</button>
            </div>
          )}
        </div>

        {/* 3. Undo/Redo */}
        <div className={styles.undoRedoGroup}>
          <button
            type="button"
            className={styles.btn}
            onClick={handleUndo}
            title="Undo"
            disabled={historyIndexRef.current <= 0}
          >
            <i className="fas fa-undo" />
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={handleRedo}
            title="Redo"
            disabled={historyIndexRef.current >= historyRef.current.length - 1}
          >
            <i className="fas fa-redo" />
          </button>
        </div>

        {/* 4. Bold */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => executeAround('**', '**', 'bold text')}
          title="Bold"
          style={{ fontWeight: 'bold' }}
        >
          B
        </button>

        {/* 5. Italic */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => executeAround('_', '_', 'italic text')}
          title="Italic"
          style={{ fontStyle: 'italic' }}
        >
          I
        </button>

        {/* 6. Underline */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => executeAround('<u>', '</u>', 'underlined text')}
          title="Underline"
          style={{ textDecoration: 'underline' }}
        >
          U
        </button>

        {/* 7. Strikethrough */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => executeAround('~~', '~~', 'strikethrough text')}
          title="Strikethrough"
        >
          <span style={{ textDecoration: 'line-through' }}>T</span>
        </button>

        {/* 8. Text Color Picker */}
        <div className={styles.dropdownWrapper} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
            title="Text Color"
          >
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              T<span style={{ position: 'absolute', bottom: -2, right: -4, fontSize: '12px', color: '#e53e3e' }}>•</span>
            </span>
          </button>
          {openDropdown === 'color' && (
            <div className={`${styles.dropdownMenu} ${styles.colorGrid}`}>
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={styles.colorSwatch}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  onClick={() => {
                    executeAround(`<span style="color: ${c.hex}">`, '</span>', 'colored text');
                    setOpenDropdown(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 9. Background Highlight Picker */}
        <div className={styles.dropdownWrapper} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setOpenDropdown(openDropdown === 'highlight' ? null : 'highlight')}
            title="Highlight Color"
          >
            <span style={{ border: '1px solid #718096', padding: '1px 3px', borderRadius: '2px', fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>T</span>
          </button>
          {openDropdown === 'highlight' && (
            <div className={`${styles.dropdownMenu} ${styles.colorGrid}`}>
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={styles.colorSwatch}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  onClick={() => {
                    if (c.hex === '#ffffff') {
                      executeAround('<span style="background-color: transparent">', '</span>', 'text');
                    } else {
                      executeAround(`<span style="background-color: ${c.hex}">`, '</span>', 'highlighted text');
                    }
                    setOpenDropdown(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <span className={styles.divider} aria-hidden="true" />

        {/* 10. Alignment Toggles */}
        <button
          type="button"
          className={`${styles.btn} ${activeAlign === 'left' ? styles.btnActive : ''}`}
          onClick={() => applyAlignment('left')}
          title="Align Left"
        >
          <i className="fas fa-align-left" />
        </button>
        <button
          type="button"
          className={`${styles.btn} ${activeAlign === 'center' ? styles.btnActive : ''}`}
          onClick={() => applyAlignment('center')}
          title="Align Center"
        >
          <i className="fas fa-align-center" />
        </button>
        <button
          type="button"
          className={`${styles.btn} ${activeAlign === 'right' ? styles.btnActive : ''}`}
          onClick={() => applyAlignment('right')}
          title="Align Right"
        >
          <i className="fas fa-align-right" />
        </button>
        <button
          type="button"
          className={`${styles.btn} ${activeAlign === 'justify' ? styles.btnActive : ''}`}
          onClick={() => applyAlignment('justify')}
          title="Justify Text"
        >
          <i className="fas fa-align-justify" />
        </button>

        <span className={styles.divider} aria-hidden="true" />

        {/* 11. Quote (66) */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => executeBlock('> Blockquote')}
          title="Blockquote"
        >
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '18px', lineHeight: 1 }}>“</span>
        </button>

        {/* 12. Emoji Popover */}
        <div className={styles.dropdownWrapper} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setOpenDropdown(openDropdown === 'emoji' ? null : 'emoji')}
            title="Insert Emoji"
          >
            <i className="far fa-smile" />
          </button>
          {openDropdown === 'emoji' && (
            <div className={`${styles.dropdownMenu} ${styles.emojiGrid}`}>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={styles.emojiBtn}
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 13. Table */}
        <button
          type="button"
          className={styles.btn}
          onClick={insertTable}
          title="Insert Table"
        >
          <i className="fas fa-th-large" />
        </button>

        {/* 14. Link */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            const sel = textareaRef.current?.value.slice(
              textareaRef.current.selectionStart,
              textareaRef.current.selectionEnd
            ) || '';
            setLinkText(sel);
            setLinkUrl('');
            setLinkModalOpen(true);
          }}
          title="Insert Link"
        >
          <i className="fas fa-link" />
        </button>

        {/* 15. Bullet list */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => executeBlock('- List item')}
          title="Bullet List"
        >
          <i className="fas fa-list-ul" />
        </button>

        {/* 16. Horizontal line (—) */}
        <button
          type="button"
          className={styles.btn}
          onClick={() => executeBlock('---')}
          title="Horizontal Line"
        >
          <span>—</span>
        </button>

        {/* 17. More options dropdown (...) */}
        <div className={styles.dropdownWrapper} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')}
            title="More Formatting Options"
          >
            <i className="fas fa-ellipsis-h" />
          </button>
          {openDropdown === 'more' && (
            <div className={`${styles.dropdownMenu} ${styles.dropdownMenuRight}`}>
              <button type="button" className={styles.dropdownItem} onClick={applyDropCap}>
                <i className="fas fa-heading" style={{ marginRight: '6px' }} /> Drop Cap
              </button>
              <button type="button" className={styles.dropdownItem} onClick={() => executeAround('`', '`', 'code')}>
                <i className="fas fa-code" style={{ marginRight: '6px' }} /> Inline Code
              </button>
              <button type="button" className={styles.dropdownItem} onClick={() => executeBlock('```\ncode here\n```')}>
                <i className="fas fa-file-code" style={{ marginRight: '6px' }} /> Code Block
              </button>
            </div>
          )}
        </div>

        {/* 18. Pin/Location */}
        <button
          type="button"
          className={styles.btn}
          onClick={insertLocation}
          title="Insert Location"
        >
          <i className="fas fa-map-marker-alt" />
        </button>

      </div>

      {/* ── Image modal ── */}
      {imageModalOpen && (
        <div className={styles.modalOverlay} onClick={closeImageModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Insert image">

            {/* Header */}
            <div className={styles.modalHeader}>
              <i className="fas fa-image" aria-hidden="true" />
              <span>Insert Image</span>
              <button type="button" className={styles.modalClose} onClick={closeImageModal} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${imgTab === 'url' ? styles.tabActive : ''}`}
                onClick={() => { setImgTab('url'); setImgPreviewErr(false); }}
              >
                <i className="fas fa-link" aria-hidden="true" /> Image URL
              </button>
              <button
                type="button"
                className={`${styles.tab} ${imgTab === 'upload' ? styles.tabActive : ''}`}
                onClick={() => { setImgTab('upload'); setImgPreviewErr(false); }}
              >
                <i className="fas fa-upload" aria-hidden="true" /> Upload from Device
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* ── URL tab ── */}
              {imgTab === 'url' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Image URL *</label>
                  <input
                    autoFocus
                    type="url"
                    className={styles.fieldInput}
                    value={imgUrl}
                    onChange={e => { setImgUrl(e.target.value); setImgPreviewErr(false); }}
                    placeholder="https://example.com/photo.jpg  or  /images/blog/photo.png"
                    onKeyDown={e => e.key === 'Enter' && handleInsertImage()}
                  />
                </div>
              )}

              {/* ── Upload tab ── */}
              {imgTab === 'upload' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Choose image from your device</label>

                  {/* Drop zone */}
                  <div
                    className={`${styles.dropZone} ${uploading ? styles.dropZoneLoading : ''}`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) {
                        const syntheticEvt = { target: { files: [f] } } as any;
                        handleFileChange(syntheticEvt);
                      }
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      className={styles.fileHidden}
                      onChange={handleFileChange}
                    />
                    {uploading ? (
                      <div className={styles.uploadingState}>
                        <i className="fas fa-spinner fa-spin" />
                        <span>Uploading…</span>
                      </div>
                    ) : uploadedUrl ? (
                      <div className={styles.uploadSuccess}>
                        <i className="fas fa-check-circle" />
                        <span>Uploaded! Click to replace</span>
                      </div>
                    ) : (
                      <div className={styles.dropZoneContent}>
                        <i className="fas fa-cloud-upload-alt" />
                        <span>Click or drag &amp; drop an image here</span>
                        <span className={styles.dropZoneHint}>JPG, PNG, WebP, GIF, SVG — max 5 MB</span>
                      </div>
                    )}
                  </div>

                  {uploadErr && (
                    <div className={styles.uploadErrMsg}>
                      <i className="fas fa-exclamation-triangle" /> {uploadErr}
                    </div>
                  )}
                </div>
              )}

              {/* Alt text — shared */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Alt text <span className={styles.optional}>(accessibility & SEO)</span></label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={imgAlt}
                  onChange={e => setImgAlt(e.target.value)}
                  placeholder="Describe the image…"
                  onKeyDown={e => e.key === 'Enter' && handleInsertImage()}
                />
              </div>

              {/* Alignment — shared */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Alignment</label>
                <div className={styles.alignGroup}>
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button
                      key={a}
                      type="button"
                      className={`${styles.alignBtn} ${imgAlign === a ? styles.alignBtnActive : ''}`}
                      onClick={() => setImgAlign(a)}
                      aria-pressed={imgAlign === a}
                      title={`Align ${a}`}
                    >
                      <i className={`fas fa-align-${a}`} aria-hidden="true" />
                      <span>{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              {previewUrl && (
                <div className={styles.previewArea}>
                  <span className={styles.previewLabel}>Preview</span>
                  {imgPreviewErr ? (
                    <div className={styles.previewErr}>
                      <i className="fas fa-exclamation-triangle" />
                      Cannot load image — check the URL
                    </div>
                  ) : (
                    <div style={{ textAlign: imgAlign, padding: '6px' }}>
                      <img
                        src={previewUrl}
                        alt={imgAlt || 'preview'}
                        className={styles.previewImg}
                        style={{ display: 'inline-block' }}
                        onError={() => setImgPreviewErr(true)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Output preview */}
              <div className={styles.mdPreview}>
                <i className="fas fa-code" aria-hidden="true" />
                <code>
                  {previewUrl
                    ? buildImageMarkdown(previewUrl, imgAlt, imgAlign).replace(/\n/g, ' ')
                    : '![image](url)'}
                </code>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={closeImageModal}>Cancel</button>
              <button
                type="button"
                className={styles.insertBtn}
                onClick={handleInsertImage}
                disabled={!activeUrl.trim() || uploading}
              >
                <i className="fas fa-plus" aria-hidden="true" />
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link modal ── */}
      {linkModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setLinkModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Insert link">
            <div className={styles.modalHeader}>
              <i className="fas fa-link" aria-hidden="true" />
              <span>Insert Link</span>
              <button type="button" className={styles.modalClose} onClick={() => setLinkModalOpen(false)} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>URL *</label>
                <input
                  autoFocus
                  type="url"
                  className={styles.fieldInput}
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={e => e.key === 'Enter' && handleInsertLink()}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Link text <span className={styles.optional}>(optional)</span></label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder="Click here"
                  onKeyDown={e => e.key === 'Enter' && handleInsertLink()}
                />
              </div>
              <div className={styles.mdPreview}>
                <i className="fas fa-code" aria-hidden="true" />
                <code>[{linkText || 'link text'}]({linkUrl || 'url'})</code>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setLinkModalOpen(false)}>Cancel</button>
              <button type="button" className={styles.insertBtn} onClick={handleInsertLink} disabled={!linkUrl.trim()}>
                <i className="fas fa-link" aria-hidden="true" />
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
