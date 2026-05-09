// ============================================================
//  config.js — Supabase connection & all global app state
//  ⚠️  Move SUPA_URL and SUPA_KEY to Netlify environment
//      variables when you're ready. For now they stay here.
// ============================================================

export const SUPA_URL = 'https://lshnrxjscisyklldabra.supabase.co';
export const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaG5yeGpzY2lzeWtsbGRhYnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDYyNzgsImV4cCI6MjA5MDIyMjI3OH0.yRQCa5b8xM0onkFZYWNpGTT4l7RcZP_bxwpddryHlT8';

// ── Global Supabase client (set in auth.js on boot) ──────────
export let sb = null;
export function setSB(client) { sb = client; }

// ── Auth / User ──────────────────────────────────────────────
export let me = null;
export let myShopId = null;
export let myShopName = 'Shop Name';
export function setMe(user)       { me = user; }
export function setMyShopId(id)   { myShopId = id; }
export function setMyShopName(n)  { myShopName = n; }

// ── App data arrays ───────────────────────────────────────────
export let employees    = [];
export let services     = [];
export let transactions = [];
export let expenses     = [];
export let sessions     = [];
export let activeSession = null;

export function setEmployees(d)    { employees = d; }
export function setServices(d)     { services = d; }
export function setTransactions(d) { transactions = d; }
export function setExpenses(d)     { expenses = d; }
export function setSessions(d)     { sessions = d; }
export function setActiveSession(s){ activeSession = s; }

// ── POS state ────────────────────────────────────────────────
export let cart      = [];
export let payM      = 'cash';
export let activeEmp = null;
export let curRole   = null;
export let lastTxn   = null;

export function setCart(c)      { cart = c; }
export function setPayM(m)      { payM = m; }
export function setActiveEmp(e) { activeEmp = e; }
export function setCurRole(r)   { curRole = r; }
export function setLastTxn(t)   { lastTxn = t; }

// ── Security ─────────────────────────────────────────────────
export let adminPin = localStorage.getItem('mrleo_admin_pin') || '9999';
export function setAdminPin(p)  { adminPin = p; localStorage.setItem('mrleo_admin_pin', p); }

// ── PIN pad buffers ───────────────────────────────────────────
export let pTarg  = null;
export let pAdmin = false;
export let pBuf   = '';
export let blBuf  = '';
export function setPTarg(t)  { pTarg = t; }
export function setPAdmin(b) { pAdmin = b; }
export function setPBuf(s)   { pBuf = s; }
export function setBlBuf(s)  { blBuf = s; }

// ── Admin UI ─────────────────────────────────────────────────
export const COLORS = ['#d29922','#4CAF7C','#388bfd','#E85D26','#B388FF','#FF6B6B','#FFD54F','#4DB6AC'];
export let selColor = COLORS[0];
export function setSelColor(c) { selColor = c; }

// ── Super Admin ──────────────────────────────────────────────
export let isSuperAdmin    = false;
export let sa_shops        = [];
export let sa_allTxn       = [];
export let sa_allExp       = [];
export let sa_allSess      = [];
export let sa_allEmp       = [];
export let sa_allSvc       = [];
export let sa_selectedShop = 'all';

export function setIsSuperAdmin(b)    { isSuperAdmin = b; }
export function setSaShops(d)         { sa_shops = d; }
export function setSaAllTxn(d)        { sa_allTxn = d; }
export function setSaAllExp(d)        { sa_allExp = d; }
export function setSaAllSess(d)       { sa_allSess = d; }
export function setSaAllEmp(d)        { sa_allEmp = d; }
export function setSaAllSvc(d)        { sa_allSvc = d; }
export function setSaSelectedShop(id) { sa_selectedShop = id; }
