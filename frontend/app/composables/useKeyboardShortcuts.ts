export interface KeyboardShortcutOptions {
  onEscape?: () => void
  onSpace?: () => void
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  disabled?: Ref<boolean>
}

/**
 * Universal keyboard shortcuts management for workflow editor
 */
export const useKeyboardShortcuts = (options: KeyboardShortcutOptions = {}) => {
  const {
    onEscape,
    onSpace,
    onSave,
    onUndo,
    onRedo,
    onDelete,
    disabled = ref(false)
  } = options

  const handleKeydown = (event: KeyboardEvent) => {
    if (disabled.value || isTypingInInput(event.target)) {
      return
    }

    const { key, ctrlKey, metaKey, shiftKey } = event
    const isModified = ctrlKey || metaKey

    switch (key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault()
          onEscape()
        }
        break

      case ' ':
        if (onSpace && !isModified) {
          event.preventDefault()
          onSpace()
        }
        break

      case 's':
        if (onSave && isModified) {
          event.preventDefault()
          onSave()
        }
        break

      case 'z':
        if (isModified) {
          event.preventDefault()
          if (shiftKey && onRedo) {
            onRedo()
          } else if (!shiftKey && onUndo) {
            onUndo()
          }
        }
        break

      case 'y':
        if (onRedo && isModified) {
          event.preventDefault()
          onRedo()
        }
        break

      case 'Delete':
      case 'Backspace':
        if (onDelete && !isModified) {
          event.preventDefault()
          onDelete()
        }
        break
    }
  }

  const isTypingInInput = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) {
      return false
    }

    const tagName = target.tagName.toLowerCase()
    const isContentEditable = target.contentEditable === 'true'

    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      isContentEditable ||
      target.closest('[contenteditable="true"]') !== null
    )
  }

  const setup = () => {
    document.addEventListener('keydown', handleKeydown)
  }

  const cleanup = () => {
    document.removeEventListener('keydown', handleKeydown)
  }

  onMounted(() => {
    setup()
  })

  onUnmounted(() => {
    cleanup()
  })

  const enableShortcuts = () => {
    disabled.value = false
  }

  const disableShortcuts = () => {
    disabled.value = true
  }

  const withDisabledShortcuts = async (callback: () => Promise<void> | void) => {
    const wasDisabled = disabled.value
    disabled.value = true

    try {
      await callback()
    } finally {
      disabled.value = wasDisabled
    }
  }

  return {
    disabled: readonly(disabled),
    enableShortcuts,
    disableShortcuts,
    withDisabledShortcuts,
    setup,
    cleanup
  }
}