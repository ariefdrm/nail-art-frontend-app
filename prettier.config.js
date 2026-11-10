//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  // Sorts Tailwind classes in a fixed order (className, cn(), cva(), clsx()).
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/styles.css',
  tailwindFunctions: ['cn', 'cva', 'clsx'],
}

export default config
