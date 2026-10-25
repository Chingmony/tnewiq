// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App'
import { I18nProvider } from '../../src/i18n'
import { fixtureFetch } from './fixtures'

function renderApp() {
  return render(
    <I18nProvider>
      <App fetchImpl={fixtureFetch()} />
    </I18nProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
})
afterEach(cleanup)

describe('App', () => {
  it('loads real-shaped data and keeps headlines in their original language', async () => {
    window.location.hash = 'latest'
    renderApp()
    expect(await screen.findByText('Fixture: Rust compiler release improves build times', { selector: 'a' })).toBeInTheDocument()
    const km = screen.getByText('ឧបករណ៍សន្តិសុខថ្មីសម្រាប់អ្នកអភិវឌ្ឍន៍', { selector: 'a' })
    expect(km.closest('h3')).toHaveAttribute('lang', 'km')
    expect(km.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('says when the source gave no publication date', async () => {
    renderApp()
    expect(await screen.findByText(/Publication date not provided by the source/)).toBeInTheDocument()
  })

  it('switches the interface language, updates <html lang> and remembers the choice', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await screen.findAllByText('Read original')
    await user.selectOptions(screen.getByLabelText('Interface language'), 'km')
    expect(screen.getAllByText('អានអត្ថបទដើម').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'ទំព័រដើម' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('km')
    unmount()

    renderApp()
    expect((await screen.findAllByText('អានអត្ថបទដើម')).length).toBeGreaterThan(0)
  })

  it.each([
    ['zh-CN', '阅读原文', '首页'],
    ['ko', '원문 읽기', '홈'],
  ])('renders the %s interface', async (locale, readOriginal, home) => {
    localStorage.setItem('tnewiq.locale', JSON.stringify(locale))
    renderApp()
    expect((await screen.findAllByText(readOriginal)).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: home })).toBeInTheDocument()
  })

  it('offers external translation only for articles in another language', async () => {
    window.location.hash = 'latest'
    renderApp()
    const enTitle = await screen.findByText('Fixture: Rust compiler release improves build times', { selector: 'a' })
    const enArticle = enTitle.closest('article')!
    expect(within(enArticle).queryByRole('link', { name: /Translate page/ })).toBeNull()
    const koArticle = screen.getByText('쿠버네티스 신규 버전 출시', { selector: 'a' }).closest('article')!
    expect(within(koArticle).getByRole('link', { name: /Translate page/ }).getAttribute('href')).toContain('tl=en')
  })

  it('searches and filters by topic', async () => {
    window.location.hash = 'latest'
    const user = userEvent.setup()
    renderApp()
    await screen.findAllByText('Read original')
    await user.type(screen.getByLabelText('Search technologies'), '芯片')
    expect(screen.getByText('1 results')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Search technologies'))
    await user.click(within(screen.getByRole('group', { name: 'Filter by topic' })).getByRole('button', { name: 'Cybersecurity' }))
    expect(screen.getByText('1 results')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search technologies'), 'nothing-matches-this')
    expect(screen.getByText(/No stories match your search/)).toBeInTheDocument()
  })

  it('saves bookmarks locally and shows them in Bookmarks', async () => {
    const user = userEvent.setup()
    renderApp()
    const title = await screen.findByText('新一代移动芯片发布', { selector: 'a' })
    await user.click(within(title.closest('article')!).getByRole('button', { name: /Bookmark/ }))
    expect(JSON.parse(localStorage.getItem('tnewiq.bookmarks')!)).toHaveLength(1)

    await user.click(screen.getByRole('link', { name: 'Bookmarks' }))
    const list = screen.getByRole('heading', { name: 'Bookmarks', level: 2 }).closest('section')!
    expect(within(list).getByText('新一代移动芯片发布')).toBeInTheDocument()

    await user.click(within(list).getByRole('button', { name: /Remove bookmark/ }))
    expect(within(list).getByText(/You have no bookmarks yet/)).toBeInTheDocument()
  })

  it('shows an error with a retry button when data cannot load', async () => {
    const failing = (async () => new Response('nope', { status: 500 })) as typeof fetch
    render(
      <I18nProvider>
        <App fetchImpl={failing} />
      </I18nProvider>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Stories could not be loaded')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

describe('Appearance', () => {
  it('stores the theme choice and applies it to <html>', async () => {
    window.location.hash = 'settings'
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByLabelText('Dark'))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('tnewiq.theme')!)).toBe('dark')
    await user.click(screen.getByLabelText('Match device'))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
