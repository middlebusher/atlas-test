import Link from "next/link";
import { Home } from "lucide-react";
import type { ReactNode } from "react";

function ReviewIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FDFCFD" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 8H8.66667M14 4H5.33333M14 12H8.66667M2 4V6.66667M2 6.66667C2 7.4 2.6 8 3.33333 8H5.33333M2 6.66667V10.6667C2 11.4 2.6 12 3.33333 12H5.33333" stroke={stroke} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlanningIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FDFCFD" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 11.3335L3.33333 12.6668L6 10.0002M8.66667 4.00016H14M8.66667 8.00016H14M8.66667 12.0002H14M2.66667 3.3335H5.33333C5.70152 3.3335 6 3.63197 6 4.00016V6.66683C6 7.03502 5.70152 7.3335 5.33333 7.3335H2.66667C2.29848 7.3335 2 7.03502 2 6.66683V4.00016C2 3.63197 2.29848 3.3335 2.66667 3.3335Z" stroke={stroke} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ReposIcon({ active }: { active: boolean }) {
  const fill = active ? "#FDFCFD" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.24282 7.56292L1.80574 7.3201L1.3201 8.19426L1.75718 8.43708L2 8L2.24282 7.56292ZM8 11.3333L7.75718 11.7704C7.90819 11.8543 8.09181 11.8543 8.24282 11.7704L8 11.3333ZM14.2428 8.43708L14.6799 8.19426L14.1943 7.3201L13.7572 7.56292L14 8L14.2428 8.43708ZM2.24282 10.2296L1.80574 9.98677L1.3201 10.8609L1.75718 11.1037L2 10.6667L2.24282 10.2296ZM8 14L7.75718 14.4371C7.90819 14.521 8.09181 14.521 8.24282 14.4371L8 14ZM14.2428 11.1037L14.6799 10.8609L14.1943 9.98677L13.7572 10.2296L14 10.6667L14.2428 11.1037ZM2 5.33333L1.75718 4.89625L0.970437 5.33333L1.75718 5.77041L2 5.33333ZM8 2L8.24282 1.56292C8.09181 1.47903 7.90819 1.47903 7.75718 1.56292L8 2ZM14 5.33333L14.2428 5.77041L15.0296 5.33333L14.2428 4.89625L14 5.33333ZM8 8.66667L7.75718 9.10375C7.90819 9.18764 8.09181 9.18764 8.24282 9.10375L8 8.66667ZM2 8L1.75718 8.43708L7.75718 11.7704L8 11.3333L8.24282 10.8963L2.24282 7.56292L2 8ZM8 11.3333L8.24282 11.7704L14.2428 8.43708L14 8L13.7572 7.56292L7.75718 10.8963L8 11.3333ZM2 10.6667L1.75718 11.1037L7.75718 14.4371L8 14L8.24282 13.5629L2.24282 10.2296L2 10.6667ZM8 14L8.24282 14.4371L14.2428 11.1037L14 10.6667L13.7572 10.2296L7.75718 13.5629L8 14ZM2 5.33333L2.24282 5.77041L8.24282 2.43708L8 2L7.75718 1.56292L1.75718 4.89625L2 5.33333ZM8 2L7.75718 2.43708L13.7572 5.77041L14 5.33333L14.2428 4.89625L8.24282 1.56292L8 2ZM14 5.33333L13.7572 4.89625L7.75718 8.22959L8 8.66667L8.24282 9.10375L14.2428 5.77041L14 5.33333ZM8 8.66667L8.24282 8.22959L2.24282 4.89625L2 5.33333L1.75718 5.77041L7.75718 9.10375L8 8.66667Z" fill={fill}/>
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FDFCFD" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" stroke={stroke} strokeMiterlimit="10"/>
      <path d="M6 2V14" stroke={stroke} strokeMiterlimit="10"/>
      <path d="M6 9.6665L14 9.6665" stroke={stroke} strokeMiterlimit="10"/>
    </svg>
  );
}

function ReportsIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FDFCFD" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g clipPath="url(#clip0_reports)">
        <path d="M14.6667 8.00016C14.6667 11.6821 11.6819 14.6668 8.00001 14.6668C4.31811 14.6668 1.33334 11.6821 1.33334 8.00016C1.33334 4.31826 4.31811 1.3335 8.00001 1.3335M14.6667 8.00016C14.6667 4.31826 11.6819 1.3335 8.00001 1.3335M14.6667 8.00016H8.00001L8.00001 1.3335M12.7247 3.2755L3.27538 12.6958M10.9565 2.02915L8.00001 4.98567M14 5.10158L11.1015 8.00013" stroke={stroke} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="clip0_reports">
          <rect width="16" height="16" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

function LearningsIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FDFCFD" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 4.66656C8 3.44434 7 2.44434 5.77778 2.44434H1.61111V10.6666H5.80556C8 10.6666 8 12.8888 8 12.8888M8 4.66656C8 3.44434 9 2.44434 10.2222 2.44434H14.3889V10.6666H10.2222C8 10.6666 8 12.8888 8 12.8888M8 4.66656V12.8888M9.25001 13.4166C9.52779 12.8332 10.1389 12.4443 10.7778 12.4443H14.6667M6.75001 13.4166C6.47223 12.8332 5.8889 12.4443 5.22223 12.4443H1.33334" stroke={stroke} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ConfigIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FDFCFD" : "currentColor";
  const fill = active ? "#FDFCFD" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.99999 9.33317L11.3333 6.33317M12.6667 9.33317C12.6667 11.9105 10.5773 13.9998 7.99999 13.9998C5.42267 13.9998 3.33333 11.9105 3.33333 9.33317C3.33333 6.75584 5.42267 4.6665 7.99999 4.6665C10.5773 4.6665 12.6667 6.75584 12.6667 9.33317Z" stroke={stroke} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.83333 5.50016C3.29357 5.50016 3.66667 5.12707 3.66667 4.66683C3.66667 4.20659 3.29357 3.8335 2.83333 3.8335C2.3731 3.8335 2 4.20659 2 4.66683C2 5.12707 2.3731 5.50016 2.83333 5.50016Z" fill={fill}/>
      <path d="M8.11111 3.00016C8.57135 3.00016 8.94445 2.62707 8.94445 2.16683C8.94445 1.70659 8.57135 1.3335 8.11111 1.3335C7.65088 1.3335 7.27778 1.70659 7.27778 2.16683C7.27778 2.62707 7.65088 3.00016 8.11111 3.00016Z" fill={fill}/>
      <path d="M13.3889 5.50016C13.8491 5.50016 14.2222 5.12707 14.2222 4.66683C14.2222 4.20659 13.8491 3.8335 13.3889 3.8335C12.9287 3.8335 12.5556 4.20659 12.5556 4.66683C12.5556 5.12707 12.9287 5.50016 13.3889 5.50016Z" fill={fill}/>
    </svg>
  );
}

const navItems: { label: string; href: string; active: boolean; icon: (props: { active: boolean }) => ReactNode }[] = [
  { label: "Review", href: "#", active: true, icon: ReviewIcon },
  { label: "Planning", href: "#", active: false, icon: PlanningIcon },
  { label: "Repositories", href: "#", active: false, icon: ReposIcon },
  { label: "Dashboard", href: "#", active: false, icon: DashboardIcon },
  { label: "Reports", href: "#", active: false, icon: ReportsIcon },
  { label: "Learnings", href: "#", active: false, icon: LearningsIcon },
  { label: "Configurations", href: "#", active: false, icon: ConfigIcon },
];

export function DashboardNav() {
  return (
    <header className="sticky top-0 z-50 flex h-11 w-full items-center border-b border-border bg-bg-surface">
      <div className="flex w-full items-center gap-3 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.3312 6.63854C13.3312 6.63854 12.2326 5.19763 10.8519 5.11522C9.96089 5.06126 9.74503 5.18342 9.70634 5.27439C9.65105 4.80263 9.25813 2.617 6.54368 2.15381C6.8902 4.71005 8.32128 4.04398 9.16406 5.80588C9.16406 5.80588 7.74186 3.82208 5.40372 4.55248C5.40372 4.55248 6.25593 6.38849 8.77665 6.76362C8.77665 6.76362 8.97865 7.47415 9.03954 7.59923C9.03954 7.59923 5.15743 5.52163 3.97868 9.50907C3.10143 9.30517 2.80718 10.2824 3.81547 10.95C3.81547 10.95 3.98703 10.2509 4.40479 10.0434C4.40479 10.0434 3.50829 11.0694 4.56251 12.2982H8.34631C8.43774 12.1428 8.84238 11.3251 7.84162 10.7061C8.54805 10.6958 9.12306 12.0633 9.74174 12.3077H10.6415C10.672 12.2317 10.7356 12.0044 10.5862 11.7998C10.3557 11.5286 9.85123 11.5653 9.85572 11.0637C10.0299 8.73027 13.4395 9.44682 13.3311 6.63854H13.3312Z" fill="white"/>
          </svg>
          <span className="text-text-primary font-medium">Acme Inc</span>
        </div>

        {/* Home */}
        <button type="button" className="rounded-[var(--radius-sm)] p-1 text-text-muted transition-colors hover:bg-bg-card hover:text-text-primary">
          <Home size={14} />
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs transition-colors ${
                item.active
                  ? "text-[#FDFCFD] font-medium"
                  : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
              }`}
            >
              <item.icon active={item.active} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="flex w-[250px] items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-bg-input px-3 py-1.5 text-xs text-text-muted">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span>Search</span>
          <kbd className="ml-auto rounded-none border border-border bg-bg-surface px-1 py-0.5 font-mono text-[10px] text-text-muted">
            ⌘K
          </kbd>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 text-text-muted">
          <button type="button" className="rounded-[var(--radius-sm)] p-1 hover:bg-bg-card hover:text-text-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M12 6a4 4 0 10-8 0c0 3-1.5 5-1.5 5h11S12 9 12 6z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M9.5 13a1.5 1.5 0 01-3 0" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <img src="/avatar.svg" alt="Avatar" width={25} height={25} className="cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
