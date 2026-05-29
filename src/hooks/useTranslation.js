import { useLocale } from '../context/LocaleContext'
import { getTranslation } from '../lib/translations'

export function useTranslation() {
  const { prefs, toggleLang, update, reset } = useLocale()

  function t(key, vars) {
    return getTranslation(prefs.lang, key, vars)
  }

  return { t, lang: prefs.lang, toggleLang, prefs, update, reset }
}
