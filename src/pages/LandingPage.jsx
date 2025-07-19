import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import LanguageSelector from '../components/ui/LanguageSelector'

const LandingPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleContactSales = () => {
    const subject = encodeURIComponent('Enterprise Plan Inquiry - Technoagentes')
    const body = encodeURIComponent(`Hello,

I'm interested in learning more about the Enterprise plan for Technoagentes.

Please provide me with:
- Detailed pricing information
- Implementation timeline
- Custom features available
- Support options

Thank you for your time.

Best regards,`)
    
    window.location.href = `mailto:forecaster@technoagents.io?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">Technoagentes</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                {t('nav.login')}
              </Button>
              <Button
                onClick={() => navigate('/register')}
              >
                {t('nav.register')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
            >
              {t('hero.getStarted')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // TODO: Implement demo request
                alert('Demo request functionality coming soon!')
              }}
            >
              {t('hero.requestDemo')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-slate-600">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: t('features.forecasting.title'),
                description: t('features.forecasting.description'),
                icon: '📊'
              },
              {
                title: t('features.automation.title'),
                description: t('features.automation.description'),
                icon: '🤖'
              },
              {
                title: t('features.realtime.title'),
                description: t('features.realtime.description'),
                icon: '⚡'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-slate-600">
              {t('howItWorks.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: t('howItWorks.step1.title'),
                description: t('howItWorks.step1.description'),
                icon: '📤'
              },
              {
                step: '02', 
                title: t('howItWorks.step2.title'),
                description: t('howItWorks.step2.description'),
                icon: '🧠'
              },
              {
                step: '03',
                title: t('howItWorks.step3.title'),
                description: t('howItWorks.step3.description'),
                icon: '🚀'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-slate-600">
              {t('pricing.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {t('pricing.starter.name')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('pricing.starter.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">
                  ${t('pricing.starter.price')}
                </span>
                <span className="text-slate-600">/{t('pricing.monthly').toLowerCase()}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {t('pricing.starter.features', { returnObjects: true }).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-slate-600">
                    <svg className="w-4 h-4 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" onClick={() => navigate('/register')}>
                {t('pricing.getStarted')}
              </Button>
            </div>

            {/* Professional Plan */}
            <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6 shadow-sm relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {t('pricing.mostPopular')}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {t('pricing.professional.name')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('pricing.professional.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">
                  ${t('pricing.professional.price')}
                </span>
                <span className="text-slate-600">/{t('pricing.monthly').toLowerCase()}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {t('pricing.professional.features', { returnObjects: true }).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-slate-600">
                    <svg className="w-4 h-4 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate('/register')}>
                {t('pricing.getStarted')}
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {t('pricing.enterprise.name')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('pricing.enterprise.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">
                  {t('pricing.enterprise.price')}
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                {t('pricing.enterprise.features', { returnObjects: true }).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-slate-600">
                    <svg className="w-4 h-4 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleContactSales}
              >
                {t('pricing.contactSales')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-slate-600">
              {t('testimonials.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: t('testimonials.testimonial1.text'),
                author: t('testimonials.testimonial1.author'),
                position: t('testimonials.testimonial1.position'),
                company: t('testimonials.testimonial1.company')
              },
              {
                text: t('testimonials.testimonial2.text'),
                author: t('testimonials.testimonial2.author'),
                position: t('testimonials.testimonial2.position'),
                company: t('testimonials.testimonial2.company')
              },
              {
                text: t('testimonials.testimonial3.text'),
                author: t('testimonials.testimonial3.author'),
                position: t('testimonials.testimonial3.position'),
                company: t('testimonials.testimonial3.company')
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="text-primary-600 mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                <p className="text-slate-600 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-semibold text-slate-900">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-slate-600">
                    {testimonial.position}
                  </p>
                  <p className="text-sm text-primary-600 font-medium">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            {t('cta.subtitle')}
          </p>
          <Button
            size="xl"
            onClick={() => navigate('/register')}
          >
            {t('cta.button')}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('footer.title')}</h3>
            <p className="text-slate-600">
              {t('footer.subtitle')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage