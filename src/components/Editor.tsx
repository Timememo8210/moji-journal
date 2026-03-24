'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { useI18n } from '@/contexts/I18nContext'

interface EditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  onEditorReady?: (editor: any) => void
}

export default function Editor({ content, onChange, placeholder, onEditorReady }: EditorProps) {
  const { t } = useI18n()
  const resolvedPlaceholder = placeholder || t('editorPlaceholder')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: resolvedPlaceholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-base max-w-none focus:outline-none dark:text-gray-100',
      },
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor)
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          &ldquo;
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-11 h-11 rounded-xl text-base font-medium flex items-center justify-center transition-colors ${
        active
          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  )
}
