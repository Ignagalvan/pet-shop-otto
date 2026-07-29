import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ADMIN_DAY_COOKIE,
  adminDayCookieValue,
  getAdminDay,
  isAdminLoginFromToday,
} from '@/lib/admin-session'
import { getPublicSupabaseConfig, isSupabaseConfigured } from './config'

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured()) return response

  const { url, anonKey } = getPublicSupabaseConfig()
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  const hasAuthenticatedUser = Boolean(claims?.sub)
  const sessionId =
    typeof claims?.session_id === 'string' ? claims.session_id : ''

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginRoute = request.nextUrl.pathname === '/admin/login'
  const currentDay = getAdminDay()
  const expectedDayCookie =
    currentDay && sessionId
      ? adminDayCookieValue(currentDay, sessionId)
      : null
  let hasDailyAdminLogin =
    hasAuthenticatedUser &&
    expectedDayCookie !== null &&
    request.cookies.get(ADMIN_DAY_COOKIE)?.value === expectedDayCookie

  if (hasAuthenticatedUser && !hasDailyAdminLogin) {
    const { data: userData } = await supabase.auth.getUser()
    hasDailyAdminLogin = isAdminLoginFromToday(
      userData.user?.last_sign_in_at,
    )

    if (hasDailyAdminLogin && expectedDayCookie) {
      response.cookies.set(ADMIN_DAY_COOKIE, expectedDayCookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/admin',
        maxAge: 60 * 60 * 26,
      })
    }
  }

  if (isAdminRoute && !isLoginRoute && !hasDailyAdminLogin) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    if (hasAuthenticatedUser) {
      loginUrl.searchParams.set('motivo', 'nuevo-dia')
    }
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginRoute && hasDailyAdminLogin) {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = '/admin'
    adminUrl.search = ''
    return NextResponse.redirect(adminUrl)
  }

  return response
}
