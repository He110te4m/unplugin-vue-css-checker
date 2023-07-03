import nestedPlugin from 'postcss-nested'
import styleSyntax from 'postcss-syntax'
import importPlugin from 'postcss-import'
import selectorParser from 'postcss-selector-parser'

export const syntax = styleSyntax({
  less: 'postcss-less',
  scss: 'postcss-scss',
  sass: 'postcss-sass',
})

export const plugins = [
  nestedPlugin,
  importPlugin,
]

export { selectorParser }
