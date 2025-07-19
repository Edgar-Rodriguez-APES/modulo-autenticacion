import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' }
]

const LanguageSelector = () => {
  const { i18n } = useTranslation()
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode)
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <GlobeAltIcon className="w-4 h-4 mr-2" />
          <span className="mr-1">{currentLanguage.flag}</span>
          {currentLanguage.name}
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 w-48 mt-2 origin-top-right bg-white border border-slate-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(language.code)}
                    className={`${
                      active ? 'bg-slate-100' : ''
                    } ${
                      language.code === i18n.language ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                    } group flex items-center w-full px-4 py-2 text-sm`}
                  >
                    <span className="mr-3">{language.flag}</span>
                    {language.name}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export default LanguageSelector