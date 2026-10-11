import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Lock,
  ArrowRight,
  PieChart,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { useAuth } from '../context/AuthContext.js';

export const Landing: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#08090B] text-[#F4F1EA] flex flex-col selection:bg-[#C9B58A]/20">
      {/* 1. Top Bar Contract: Brand - 4-6 Nav links - Primary Actions */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-[#252830] sticky top-0 bg-[#08090B]/90 backdrop-blur-md z-40">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-sm tracking-wider shadow-sm">
            FT
          </div>
          <span className="text-lg font-bold tracking-tight text-[#F4F1EA]">FinTrack</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8E929B]">
          <a href="#features" className="hover:text-[#F4F1EA] transition-colors">Features</a>
          <a href="#preview" className="hover:text-[#F4F1EA] transition-colors">Dashboard</a>
          <a href="#security" className="hover:text-[#F4F1EA] transition-colors">Security</a>
          <a href="#how-it-works" className="hover:text-[#F4F1EA] transition-colors">How it works</a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                Open Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 lg:px-12 pt-16 sm:pt-24 pb-16 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="text-xs font-semibold tracking-wider uppercase text-[#C9B58A] mb-4">
          Personal Finance, Simplified
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#F4F1EA] leading-[1.12] mb-6 max-w-3xl text-balance">
          Take Control of Your Money.
        </h1>

        <p className="text-base sm:text-lg text-[#8E929B] max-w-2xl leading-relaxed mb-8">
          Track your spending, understand your habits, and make smarter financial decisions from one simple dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8" icon={<ArrowRight className="w-4 h-4" />}>
              Get Started
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6">
              Explore Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#8E929B]">
          <span>Row Level Security</span>
          <span aria-hidden="true">·</span>
          <span>Zero Third-Party Trackers</span>
          <span aria-hidden="true">·</span>
          <span>Instant CSV Ledger Export</span>
        </div>
      </section>

      {/* 3. Product Preview Mockup */}
      <section id="preview" className="px-4 sm:px-8 lg:px-12 pb-20 max-w-6xl mx-auto w-full">
        <div className="rounded-xl border border-[#252830] bg-[#101216] p-4 sm:p-6 shadow-2xl">
          {/* Mockup Header Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#252830]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E98282]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#7ED6A5]/80" />
              <span className="text-xs font-mono text-[#8E929B] ml-2">fintrack.app / dashboard</span>
            </div>
            <div className="text-xs text-[#8E929B] font-mono">Live Demo Ledger</div>
          </div>

          {/* Grid Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="p-4 rounded-lg bg-[#15171C] border border-[#252830]">
              <span className="text-[10px] uppercase font-mono text-[#8E929B]">Total Balance</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F1EA] mt-1 tabular-nums">₹1,84,500</div>
              <span className="text-[11px] text-[#7ED6A5] mt-1 inline-block">+14.2% this month</span>
            </div>
            <div className="p-4 rounded-lg bg-[#15171C] border border-[#252830]">
              <span className="text-[10px] uppercase font-mono text-[#8E929B]">Total Income</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#7ED6A5] mt-1 tabular-nums">₹2,40,000</div>
              <span className="text-[11px] text-[#8E929B] mt-1 inline-block">2 credits received</span>
            </div>
            <div className="p-4 rounded-lg bg-[#15171C] border border-[#252830]">
              <span className="text-[10px] uppercase font-mono text-[#8E929B]">Total Expenses</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#E98282] mt-1 tabular-nums">₹55,500</div>
              <span className="text-[11px] text-[#8E929B] mt-1 inline-block">23.1% of income</span>
            </div>
            <div className="p-4 rounded-lg bg-[#15171C] border border-[#252830]">
              <span className="text-[10px] uppercase font-mono text-[#8E929B]">Monthly Savings</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#C9B58A] mt-1 tabular-nums">₹1,84,500</div>
              <span className="text-[11px] text-[#7ED6A5] mt-1 inline-block">76.9% saved</span>
            </div>
          </div>

          {/* Split Charts Preview Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-5 rounded-lg bg-[#15171C] border border-[#252830]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[#F4F1EA]">Cash Flow Trends</span>
                <span className="text-[11px] text-[#8E929B]">Last 6 Months</span>
              </div>
              <div className="h-40 flex items-end gap-3 px-2 pt-6">
                {[
                  { m: 'May', inc: 70, exp: 35 },
                  { m: 'Jun', inc: 75, exp: 40 },
                  { m: 'Jul', inc: 85, exp: 30 },
                  { m: 'Aug', inc: 90, exp: 45 },
                  { m: 'Sep', inc: 95, exp: 38 },
                  { m: 'Oct', inc: 100, exp: 32 },
                ].map((bar) => (
                  <div key={bar.m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      <div style={{ height: `${bar.inc}%` }} className="w-1/2 bg-[#7ED6A5]/80 rounded-t-sm" />
                      <div style={{ height: `${bar.exp}%` }} className="w-1/2 bg-[#E98282]/80 rounded-t-sm" />
                    </div>
                    <span className="text-[10px] font-mono text-[#8E929B]">{bar.m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-lg bg-[#15171C] border border-[#252830] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#F4F1EA]">Category Allocation</span>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { name: 'Food & Dining', val: '38%', color: '#E98282' },
                    { name: 'Shopping & Gear', val: '24%', color: '#D4A373' },
                    { name: 'Utilities & Bills', val: '18%', color: '#9575CD' },
                    { name: 'Commute & Travel', val: '12%', color: '#90A4AE' },
                  ].map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span style={{ backgroundColor: cat.color }} className="w-2 h-2 rounded-full" />
                        <span className="text-[#8E929B]">{cat.name}</span>
                      </div>
                      <span className="font-mono text-[#F4F1EA] font-medium">{cat.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-[#252830] text-[11px] text-[#8E929B]">
                Smart spending alerts active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="px-6 lg:px-12 py-20 border-t border-[#252830] max-w-6xl mx-auto w-full">
        <div className="text-xs font-semibold tracking-wider uppercase text-[#C9B58A] mb-3 text-center">
          Engineered For Financial Clarity
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F1EA] text-center mb-12">
          Everything You Need to Master Your Money
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#15171C] border border-[#252830] hover:border-[#363A45] transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#C9B58A]/10 border border-[#C9B58A]/20 text-[#C9B58A] flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F4F1EA] mb-2">Real-Time Ledger</h3>
            <p className="text-xs text-[#8E929B] leading-relaxed">
              Log transactions in seconds across custom categories, payment methods, and timestamps with instant balance updates.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#15171C] border border-[#252830] hover:border-[#363A45] transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#7ED6A5]/10 border border-[#7ED6A5]/20 text-[#7ED6A5] flex items-center justify-center mb-4">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F4F1EA] mb-2">Monthly Budget Discipline</h3>
            <p className="text-xs text-[#8E929B] leading-relaxed">
              Define monthly caps per expense category. Visual thresholds trigger alerts before you overspend.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#15171C] border border-[#252830] hover:border-[#363A45] transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#D4A373]/10 border border-[#D4A373]/20 text-[#D4A373] flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F4F1EA] mb-2">Deep Trend Analytics</h3>
            <p className="text-xs text-[#8E929B] leading-relaxed">
              Evaluate multi-month net savings rates, spending composition, and cash flows across flexible timeframes.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Security Section */}
      <section id="security" className="px-6 lg:px-12 py-20 border-t border-[#252830] bg-[#101216]/40">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#7ED6A5] mb-2">
              Enterprise Data Security
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F1EA] mb-4">
              Bank-Grade Privacy & PostgreSQL Row Level Security
            </h2>
            <p className="text-xs sm:text-sm text-[#8E929B] leading-relaxed mb-6">
              Your financial records are strictly protected with database-enforced Row Level Security (RLS). No other user or unauthorized process can ever read your transaction ledger.
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-xs text-[#F4F1EA]">
                <CheckCircle2 className="w-4 h-4 text-[#7ED6A5] shrink-0" />
                <span>Strict JWT Bearer Token verification on every endpoint</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#F4F1EA]">
                <CheckCircle2 className="w-4 h-4 text-[#7ED6A5] shrink-0" />
                <span>Zero client exposure of database service keys</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#F4F1EA]">
                <CheckCircle2 className="w-4 h-4 text-[#7ED6A5] shrink-0" />
                <span>Full CSV export sovereignty — your data belongs to you</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#15171C] border border-[#252830] max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-[#7ED6A5]/10 text-[#7ED6A5]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F4F1EA]">Supabase PostgreSQL</h4>
                <p className="text-[11px] text-[#8E929B]">RLS Enforced at Engine Level</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#08090B] font-mono text-[11px] text-[#8E929B] border border-[#252830] leading-relaxed">
              CREATE POLICY &quot;Users can only access own data&quot;<br />
              ON public.transactions<br />
              USING (auth.uid() = user_id);
            </div>
          </div>
        </div>
      </section>

      {/* 6. How It Works */}
      <section id="how-it-works" className="px-6 lg:px-12 py-20 border-t border-[#252830] max-w-5xl mx-auto w-full">
        <div className="text-xs font-semibold tracking-wider uppercase text-[#C9B58A] mb-3 text-center">
          Effortless Workflow
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#F4F1EA] text-center mb-12">
          Master Your Finances in Three Simple Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#15171C] border border-[#252830] flex items-center justify-center font-bold text-sm text-[#C9B58A] mb-4">
              01
            </div>
            <h3 className="text-sm font-semibold text-[#F4F1EA] mb-2">Create Account & Select Currency</h3>
            <p className="text-xs text-[#8E929B] leading-relaxed">
              Set up your profile with your preferred currency (INR ₹, USD $, EUR €, etc.) in less than 30 seconds.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#15171C] border border-[#252830] flex items-center justify-center font-bold text-sm text-[#C9B58A] mb-4">
              02
            </div>
            <h3 className="text-sm font-semibold text-[#F4F1EA] mb-2">Log Income, Expenses & Budgets</h3>
            <p className="text-xs text-[#8E929B] leading-relaxed">
              Add transactions with payment methods and notes, and set category spending ceilings to stay disciplined.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#15171C] border border-[#252830] flex items-center justify-center font-bold text-sm text-[#C9B58A] mb-4">
              03
            </div>
            <h3 className="text-sm font-semibold text-[#F4F1EA] mb-2">Gain Complete Visibility</h3>
            <p className="text-xs text-[#8E929B] leading-relaxed">
              Watch your net savings trend upwards with crystal-clear analytics, monthly comparisons, and CSV reports.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Call To Action Banner */}
      <section className="px-6 lg:px-12 py-16 border-t border-[#252830]">
        <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-[#15171C] to-[#101216] border border-[#252830] p-8 sm:p-12 text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F4F1EA] mb-4">
            Ready to Take Control of Your Financial Future?
          </h2>
          <p className="text-sm sm:text-base text-[#8E929B] max-w-xl mb-8 leading-relaxed">
            Join professionals and individuals using FinTrack to simplify their personal finance management today.
          </p>
          <Link to="/signup">
            <Button variant="primary" size="lg" className="px-8 font-semibold">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-[#252830] px-6 lg:px-12 py-8 text-xs text-[#8E929B] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-xs">
            FT
          </div>
          <span className="text-[#F4F1EA] font-semibold">FinTrack</span>
          <span>© {new Date().getFullYear()} FinTrack SaaS. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="hover:text-[#F4F1EA] transition-colors">Sign In</Link>
          <Link to="/signup" className="hover:text-[#F4F1EA] transition-colors">Register</Link>
          <a href="#security" className="hover:text-[#F4F1EA] transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
};
