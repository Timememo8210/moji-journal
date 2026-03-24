export type Locale = 'zh' | 'en'

const translations = {
  // App
  appName: { zh: '墨记', en: 'Moji' },
  appSubtitle: { zh: 'MOJI JOURNAL', en: 'MOJI JOURNAL' },

  // Common
  cancel: { zh: '取消', en: 'Cancel' },
  save: { zh: '保存', en: 'Save' },
  saving: { zh: '保存中...', en: 'Saving...' },
  delete: { zh: '删除', en: 'Delete' },
  deleting: { zh: '删除中...', en: 'Deleting...' },
  confirmDelete: { zh: '确认删除', en: 'Confirm' },
  back: { zh: '返回', en: 'Back' },
  goHome: { zh: '返回首页', en: 'Go Home' },
  retry: { zh: '重试', en: 'Retry' },
  loading: { zh: '加载中...', en: 'Loading...' },
  edit: { zh: '编辑', en: 'Edit' },
  clear: { zh: '清除', en: 'Clear' },
  login: { zh: '登录', en: 'Login' },
  loggingIn: { zh: '登录中...', en: 'Logging in...' },
  signOut: { zh: '退出登录', en: 'Sign Out' },
  user: { zh: '用户', en: 'User' },

  // Timeline
  export: { zh: '导出', en: 'Export' },
  monthNav: { zh: '月份导航', en: 'Month navigation' },
  searchPlaceholder: { zh: '搜索日记内容...', en: 'Search entries...' },
  allYears: { zh: '全部年份', en: 'All years' },
  allMonths: { zh: '全部月份', en: 'All months' },
  entriesCount: { zh: '篇', en: '' },
  startFirstEntry: { zh: '开始你的第一篇日记', en: 'Start your first journal entry' },
  startFirstEntryDesc: { zh: '记录生活中的点点滴滴，留住珍贵的回忆', en: 'Capture life\'s moments and preserve precious memories' },
  writeEntry: { zh: '写日记', en: 'Write' },
  noResults: { zh: '没有找到匹配的日记', en: 'No matching entries found' },
  clearFilters: { zh: '清除筛选', en: 'Clear filters' },
  exportSuccess: { zh: '导出成功', en: 'Export successful' },
  deleted: { zh: '已删除', en: 'Deleted' },
  deleteFailed: { zh: '删除失败', en: 'Delete failed' },
  loadFailed: { zh: '加载失败', en: 'Load failed' },
  networkError: { zh: '网络连接失败，请检查网络后重试', en: 'Network error, please check your connection' },
  photos: { zh: '张照片', en: 'photos' },
  yearSuffix: { zh: '年', en: '' },
  monthSuffix: { zh: '月', en: '' },

  // Entry Card
  confirmDeleteEntry: { zh: '确定删除这篇日记吗？', en: 'Delete this entry?' },

  // New Entry
  titlePlaceholder: { zh: '标题', en: 'Title' },
  addPhotos: { zh: '添加照片', en: 'Add photos' },
  aiCleanup: { zh: 'AI整理', en: 'AI Cleanup' },
  aiCleaning: { zh: 'AI整理中...', en: 'AI cleaning...' },
  generateImage: { zh: '生成配图', en: 'Generate image' },
  generating: { zh: '生成中...', en: 'Generating...' },
  editorPlaceholder: { zh: '写点什么...', en: 'Write something...' },
  entrySaved: { zh: '日记已保存', en: 'Entry saved' },
  saveFailed: { zh: '保存失败', en: 'Save failed' },
  untitled: { zh: '无题', en: 'Untitled' },
  unsavedWarning: { zh: '还有未保存的内容，确定要离开吗？', en: 'You have unsaved changes. Leave anyway?' },
  contentCleaned: { zh: '内容已整理', en: 'Content cleaned up' },
  cleanupFailed: { zh: '整理失败', en: 'Cleanup failed' },
  cleanupFailedRetry: { zh: '整理失败，请稍后重试', en: 'Cleanup failed, please try again' },
  imageGenerated: { zh: '配图已生成', en: 'Image generated' },
  imageGenFailed: { zh: '配图获取失败，请稍后重试', en: 'Image generation failed' },
  aiGeneratingImage: { zh: 'AI 配图生成中...', en: 'AI generating image...' },
  aiCleanupConfirm: { zh: 'AI已整理完成，是否替换当前内容？', en: 'AI cleanup done. Replace current content?' },
  imageFailed: { zh: '图片加载失败', en: 'Image load failed' },

  // Entry View
  notFound: { zh: '找不到这篇日记', en: 'Entry not found' },
  saved: { zh: '已保存', en: 'Saved' },
  unsavedEditWarning: { zh: '还有未保存的修改，确定要放弃吗？', en: 'Discard unsaved changes?' },

  // Auth - Login
  emailPlaceholder: { zh: '邮箱', en: 'Email' },
  passwordPlaceholder: { zh: '密码', en: 'Password' },
  forgotPassword: { zh: '忘记密码？', en: 'Forgot password?' },
  noAccount: { zh: '还没有账号？', en: 'Don\'t have an account?' },
  signUp: { zh: '注册', en: 'Sign up' },
  guestMode: { zh: '以访客身份继续（本地模式）', en: 'Continue as guest (local mode)' },

  // Auth - Signup
  createAccount: { zh: '创建账号', en: 'Create Account' },
  nicknamePlaceholder: { zh: '昵称（可选）', en: 'Display name (optional)' },
  passwordMinLength: { zh: '密码（至少6位）', en: 'Password (min 6 characters)' },
  registering: { zh: '注册中...', en: 'Creating account...' },
  passwordTooShort: { zh: '密码至少需要6位', en: 'Password must be at least 6 characters' },
  emailTaken: { zh: '该邮箱已注册，请直接登录', en: 'Email already registered, please login' },
  verificationSent: { zh: '验证邮件已发送', en: 'Verification email sent' },
  verificationDesc: { zh: '请查收验证邮件，点击链接完成注册后即可登录。', en: 'Please check your email and click the link to complete registration.' },
  goLogin: { zh: '去登录', en: 'Go to Login' },
  haveAccount: { zh: '已有账号？', en: 'Already have an account?' },

  // Voice Input
  switchToEnglish: { zh: '切换到英文', en: 'Switch to Chinese' },
  switchToChinese: { zh: 'Switch to Chinese', en: '切换到中文' },
  stopRecording: { zh: '停止录音', en: 'Stop recording' },
  voiceInput: { zh: '语音输入', en: 'Voice input' },

  // Relative dates
  justNow: { zh: '刚刚', en: 'Just now' },
  today: { zh: '今天', en: 'Today' },
  yesterday: { zh: '昨天', en: 'Yesterday' },
  daysAgo: { zh: '天前', en: ' days ago' },

  // Settings
  settings: { zh: '设置', en: 'Settings' },
  accountInfo: { zh: '账户信息', en: 'Account' },
  displayName: { zh: '显示名称', en: 'Display Name' },
  editDisplayName: { zh: '修改昵称', en: 'Edit display name' },
  changePassword: { zh: '修改密码', en: 'Change Password' },
  newPassword: { zh: '新密码', en: 'New password' },
  confirmPassword: { zh: '确认密码', en: 'Confirm password' },
  passwordMismatch: { zh: '两次密码不一致', en: 'Passwords don\'t match' },
  passwordChanged: { zh: '密码修改成功', en: 'Password changed' },
  passwordChangeFailed: { zh: '密码修改失败', en: 'Password change failed' },
  displayNameUpdated: { zh: '昵称已更新', en: 'Display name updated' },
  displayNameFailed: { zh: '昵称更新失败', en: 'Display name update failed' },
  language: { zh: '语言', en: 'Language' },
  theme: { zh: '界面风格', en: 'Theme' },
  themeLight: { zh: '浅色', en: 'Light' },
  themeDark: { zh: '深色', en: 'Dark' },
  themeSystem: { zh: '跟随系统', en: 'System' },
  data: { zh: '数据', en: 'Data' },
  exportData: { zh: '导出所有日记', en: 'Export all entries' },
  exportDataDesc: { zh: '以 JSON 格式下载', en: 'Download as JSON' },
  clearCache: { zh: '清除本地缓存', en: 'Clear local cache' },
  clearCacheDesc: { zh: '清除浏览器中的缓存数据', en: 'Clear cached data in browser' },
  clearCacheConfirm: { zh: '确定要清除本地缓存吗？', en: 'Clear local cache?' },
  cacheCleared: { zh: '缓存已清除', en: 'Cache cleared' },
  notLoggedIn: { zh: '未登录', en: 'Not logged in' },
  loginToManage: { zh: '登录以管理账户', en: 'Login to manage account' },
  update: { zh: '更新', en: 'Update' },
  unknownError: { zh: '未知错误', en: 'Unknown error' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key][locale]
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  return (localStorage.getItem('moji-lang') as Locale) || 'zh'
}

export function setStoredLocale(locale: Locale) {
  localStorage.setItem('moji-lang', locale)
}
