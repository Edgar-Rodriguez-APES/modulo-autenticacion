import React, { useState, useEffect } from 'react'
import clsx from 'clsx'

/**
 * Fade Transition Component
 * Provides smooth fade in/out animations
 */
export const FadeTransition = ({
  show = true,
  duration = 300,
  children,
  className = '',
  appear = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(show && !appear)
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      if (appear) {
        // Trigger fade in after render
        const timer = setTimeout(() => setIsVisible(true), 10)
        return () => clearTimeout(timer)
      } else {
        setIsVisible(true)
      }
    } else {
      setIsVisible(false)
      // Remove from DOM after animation
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, appear, duration])

  if (!shouldRender) return null

  return (
    <div
      className={clsx(
        'transition-opacity ease-in-out',
        {
          'opacity-100': isVisible,
          'opacity-0': !isVisible
        },
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Slide Transition Component
 * Provides slide animations from different directions
 */
export const SlideTransition = ({
  show = true,
  direction = 'up',
  duration = 300,
  distance = '100%',
  children,
  className = '',
  appear = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(show && !appear)
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      if (appear) {
        const timer = setTimeout(() => setIsVisible(true), 10)
        return () => clearTimeout(timer)
      } else {
        setIsVisible(true)
      }
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, appear, duration])

  if (!shouldRender) return null

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0)'
    
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}, 0)`
      case 'down':
        return `translate3d(0, -${distance}, 0)`
      case 'left':
        return `translate3d(${distance}, 0, 0)`
      case 'right':
        return `translate3d(-${distance}, 0, 0)`
      default:
        return `translate3d(0, ${distance}, 0)`
    }
  }

  return (
    <div
      className={clsx(
        'transition-all ease-out',
        {
          'opacity-100': isVisible,
          'opacity-0': !isVisible
        },
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transform: getTransform()
      }}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Scale Transition Component
 * Provides scale animations for modal-like components
 */
export const ScaleTransition = ({
  show = true,
  duration = 200,
  children,
  className = '',
  appear = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(show && !appear)
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      if (appear) {
        const timer = setTimeout(() => setIsVisible(true), 10)
        return () => clearTimeout(timer)
      } else {
        setIsVisible(true)
      }
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, appear, duration])

  if (!shouldRender) return null

  return (
    <div
      className={clsx(
        'transition-all ease-out origin-center',
        {
          'opacity-100 scale-100': isVisible,
          'opacity-0 scale-95': !isVisible
        },
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Page Transition Component
 * Provides smooth transitions between pages/routes
 */
export const PageTransition = ({
  children,
  className = '',
  type = 'fade',
  duration = 300
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const transitionClasses = {
    fade: {
      base: 'transition-opacity ease-in-out',
      visible: 'opacity-100',
      hidden: 'opacity-0'
    },
    slideUp: {
      base: 'transition-all ease-out',
      visible: 'opacity-100 translate-y-0',
      hidden: 'opacity-0 translate-y-4'
    },
    slideDown: {
      base: 'transition-all ease-out',
      visible: 'opacity-100 translate-y-0',
      hidden: 'opacity-0 -translate-y-4'
    },
    scale: {
      base: 'transition-all ease-out',
      visible: 'opacity-100 scale-100',
      hidden: 'opacity-0 scale-95'
    }
  }

  const transition = transitionClasses[type] || transitionClasses.fade

  return (
    <div
      className={clsx(
        transition.base,
        {
          [transition.visible]: isVisible,
          [transition.hidden]: !isVisible
        },
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * Stagger Animation Component
 * Animates children with staggered delays
 */
export const StaggeredAnimation = ({
  children,
  staggerDelay = 100,
  className = '',
  animation = 'fadeUp'
}) => {
  const [visibleItems, setVisibleItems] = useState(new Set())

  useEffect(() => {
    React.Children.forEach(children, (_, index) => {
      const timer = setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]))
      }, index * staggerDelay)

      return () => clearTimeout(timer)
    })
  }, [children, staggerDelay])

  const animationClasses = {
    fadeUp: {
      base: 'transition-all duration-500 ease-out',
      visible: 'opacity-100 translate-y-0',
      hidden: 'opacity-0 translate-y-4'
    },
    fadeIn: {
      base: 'transition-opacity duration-500 ease-out',
      visible: 'opacity-100',
      hidden: 'opacity-0'
    },
    scale: {
      base: 'transition-all duration-500 ease-out',
      visible: 'opacity-100 scale-100',
      hidden: 'opacity-0 scale-95'
    }
  }

  const anim = animationClasses[animation] || animationClasses.fadeUp

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={clsx(
            anim.base,
            {
              [anim.visible]: visibleItems.has(index),
              [anim.hidden]: !visibleItems.has(index)
            }
          )}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

/**
 * Loading Transition Component
 * Smooth transition between loading and content states
 */
export const LoadingTransition = ({
  isLoading,
  loadingComponent,
  children,
  className = '',
  duration = 300
}) => {
  return (
    <div className={clsx('relative', className)}>
      <FadeTransition show={isLoading} duration={duration}>
        {loadingComponent}
      </FadeTransition>
      
      <FadeTransition show={!isLoading} duration={duration}>
        {children}
      </FadeTransition>
    </div>
  )
}

export default {
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  PageTransition,
  StaggeredAnimation,
  LoadingTransition
}