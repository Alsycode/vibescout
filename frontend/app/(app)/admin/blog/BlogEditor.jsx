'use client';

// Rich-text editor for blog post bodies. Output is restricted to the tags the public blog
// page styles (p, h2, h3, ul, ol, li, strong, em, code, table/th/td, a), so nothing an admin
// writes here renders unstyled on the site.

import { useState } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';

const BTN = {
  padding: '6px 10px',
  fontSize: '12px',
  fontWeight: 500,
  fontFamily: 'Inter, sans-serif',
  color: 'rgba(255,255,255,0.70)',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  cursor: 'pointer',
  lineHeight: 1,
  transition: 'all 120ms ease',
};

const BTN_ACTIVE = {
  color: '#0DD8C0',
  background: 'rgba(13,216,192,0.10)',
  border: '1px solid rgba(13,216,192,0.35)',
};

function ToolButton({ label, title, active, disabled, onClick }) {
  return (
    <button
      type="button"
      title={title ?? label}
      disabled={disabled}
      // mousedown default would blur the editor and lose the selection
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        ...BTN,
        ...(active ? BTN_ACTIVE : null),
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />;
}

export default function BlogEditor({ value, onChange }) {
  const [sourceMode, setSourceMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        strike: false,
        underline: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: false },
      }),
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    immediatelyRender: false, // Next.js SSR: render the editor client-side only
    // Empty <p></p> filler (e.g. the cursor slot TipTap keeps after a table) would render as blank gaps on the site.
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? '' : ed.getHTML().replace(/<p><\/p>/g, '')),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      h2: ed?.isActive('heading', { level: 2 }) ?? false,
      h3: ed?.isActive('heading', { level: 3 }) ?? false,
      bold: ed?.isActive('bold') ?? false,
      italic: ed?.isActive('italic') ?? false,
      code: ed?.isActive('code') ?? false,
      bullet: ed?.isActive('bulletList') ?? false,
      ordered: ed?.isActive('orderedList') ?? false,
      link: ed?.isActive('link') ?? false,
      table: ed?.isActive('table') ?? false,
      canUndo: ed?.can().undo() ?? false,
      canRedo: ed?.can().redo() ?? false,
    }),
  });

  function toggleSource() {
    if (sourceMode && editor) editor.commands.setContent(value || '', { emitUpdate: false });
    setSourceMode((s) => !s);
  }

  function setLink() {
    const previous = editor.getAttributes('link').href ?? '';
    const url = window.prompt('Link URL (leave empty to remove the link)', previous);
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange('link');
    if (url.trim() === '') chain.unsetLink().run();
    else chain.setLink({ href: url.trim() }).run();
  }

  if (!editor || !state) {
    return <div className="skeleton" style={{ height: '420px', borderRadius: 'var(--radius-md)' }} />;
  }

  const run = (fn) => () => fn(editor.chain().focus()).run();

  return (
    <div className="blog-editor" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', background: '#0C0C18' }}>
      <style>{EDITOR_CSS}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
        {!sourceMode && (
          <>
            <ToolButton label="H2" title="Heading 2" active={state.h2} onClick={run((c) => c.toggleHeading({ level: 2 }))} />
            <ToolButton label="H3" title="Heading 3" active={state.h3} onClick={run((c) => c.toggleHeading({ level: 3 }))} />
            <Divider />
            <ToolButton label="B" title="Bold" active={state.bold} onClick={run((c) => c.toggleBold())} />
            <ToolButton label="I" title="Italic" active={state.italic} onClick={run((c) => c.toggleItalic())} />
            <ToolButton label="</>" title="Inline code" active={state.code} onClick={run((c) => c.toggleCode())} />
            <ToolButton label="Link" title="Add or edit link" active={state.link} onClick={setLink} />
            <Divider />
            <ToolButton label="• List" title="Bulleted list" active={state.bullet} onClick={run((c) => c.toggleBulletList())} />
            <ToolButton label="1. List" title="Numbered list" active={state.ordered} onClick={run((c) => c.toggleOrderedList())} />
            <Divider />
            <ToolButton label="Table" title="Insert 3×3 table" onClick={run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))} />
            {state.table && (
              <>
                <ToolButton label="+ Row" title="Add row below" onClick={run((c) => c.addRowAfter())} />
                <ToolButton label="− Row" title="Delete row" onClick={run((c) => c.deleteRow())} />
                <ToolButton label="+ Col" title="Add column after" onClick={run((c) => c.addColumnAfter())} />
                <ToolButton label="− Col" title="Delete column" onClick={run((c) => c.deleteColumn())} />
                <ToolButton label="Delete table" onClick={run((c) => c.deleteTable())} />
              </>
            )}
            <Divider />
            <ToolButton label="Undo" disabled={!state.canUndo} onClick={run((c) => c.undo())} />
            <ToolButton label="Redo" disabled={!state.canRedo} onClick={run((c) => c.redo())} />
          </>
        )}
        <span style={{ marginLeft: 'auto' }}>
          <ToolButton label={sourceMode ? 'Back to editor' : 'HTML'} title="Toggle raw HTML view" active={sourceMode} onClick={toggleSource} />
        </span>
      </div>

      {sourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%', minHeight: '420px', padding: '16px', boxSizing: 'border-box', resize: 'vertical',
            background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6,
          }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

// Mirrors the .blog-content rules on the public post page so the editor is WYSIWYG.
const EDITOR_CSS = `
.blog-editor .ProseMirror { min-height: 420px; padding: 16px 20px; outline: none; color: rgba(255,255,255,0.72); font-size: 15px; line-height: 1.75; }
.blog-editor .ProseMirror p { margin: 0 0 18px; }
.blog-editor .ProseMirror h2 { font-size: 22px; font-weight: 600; color: rgba(255,255,255,0.92); margin: 32px 0 14px; line-height: 1.25; }
.blog-editor .ProseMirror h3 { font-size: 17px; font-weight: 600; color: rgba(255,255,255,0.88); margin: 24px 0 10px; }
.blog-editor .ProseMirror ul, .blog-editor .ProseMirror ol { margin: 0 0 18px; padding-left: 24px; }
.blog-editor .ProseMirror ul { list-style: disc; }
.blog-editor .ProseMirror ol { list-style: decimal; }
.blog-editor .ProseMirror li { margin-bottom: 6px; }
.blog-editor .ProseMirror li p { margin: 0; }
.blog-editor .ProseMirror strong { color: rgba(255,255,255,0.88); font-weight: 600; }
.blog-editor .ProseMirror em { color: rgba(255,255,255,0.60); }
.blog-editor .ProseMirror code { font-family: var(--font-mono); font-size: 13px; padding: 2px 7px; border-radius: 4px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); color: #22D3EE; }
.blog-editor .ProseMirror a { color: #E8A030; text-decoration: none; cursor: text; }
.blog-editor .ProseMirror table { width: 100%; border-collapse: collapse; margin: 0 0 20px; table-layout: fixed; font-size: 14px; }
.blog-editor .ProseMirror th { text-align: left; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.03); }
.blog-editor .ProseMirror th, .blog-editor .ProseMirror td { padding: 9px 12px; border: 1px solid rgba(255,255,255,0.10); vertical-align: top; }
.blog-editor .ProseMirror th p, .blog-editor .ProseMirror td p { margin: 0; }
.blog-editor .ProseMirror .selectedCell { background: rgba(13,216,192,0.12); }
`;
