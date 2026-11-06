"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ArrowDownLeft,
  BookOpen,
  BriefcaseBusiness,
  ChevronUp,
  Database,
  Globe,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FairPayLogo } from "./fairpay-logo";
import { useWorkspace } from "./workspace-provider";
import { jobUrl, shortAddress } from "@/lib/jobs";
import { readableError } from "@/lib/ethereum";
import { ARC_TESTNET, paymentNetwork } from "@/lib/payments";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, account, jobs, connect, notice, notify } = useWorkspace();
  const { signOut } = useAuthActions();
  const path = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const navigation = [
    { title: "Jobs & Escrow", href: "/jobs", icon: BriefcaseBusiness },
    { title: "Arkiv Board", href: "/arkiv", icon: Database },
    { title: "Payments", href: "/payments", icon: ArrowDownLeft },
    { title: "Landing Page", href: "/", icon: Globe },
  ];
  const title =
    path === "/jobs"
      ? "Jobs & Escrow"
      : path.startsWith("/arkiv")
        ? "Arkiv Board"
        : path.startsWith("/payments")
          ? "Payments"
          : path.startsWith("/account")
            ? "Account"
            : path === "/"
              ? "Landing Page"
              : "Workspace";
  const mismatch = account && account.toLowerCase() !== user.walletAddress;
  const pageJob = jobs.find((job) => path === jobUrl(job));
  const network = paymentNetwork(pageJob?.chainId ?? ARC_TESTNET.chainId);

  async function logout() {
    setSigningOut(true);
    try {
      await signOut();
      window.location.assign("/web");
    } catch (error) {
      notify(readableError(error));
      setSigningOut(false);
    }
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-sidebar-border" collapsible="offcanvas">
        <SidebarHeader className="p-5 flex items-center justify-center">
          <Link
            href="/jobs"
            className="flex items-center justify-center gap-2.5 text-2xl font-semibold tracking-tight w-full"
          >
            <FairPayLogo size={32} />
            <span className="leading-none">FairPay</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map(({ title, href, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        href === "/" ? path === href : path.startsWith(href)
                      }
                      className="h-10 gap-3 data-[active=true]:bg-blue-500/15 data-[active=true]:text-blue-300"
                    >
                      <Link href={href}>
                        <Icon />
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Your recent jobs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {jobs.slice(0, 5).map((job) => (
                  <SidebarMenuItem key={job.id}>
                    <SidebarMenuButton
                      asChild
                      className="text-xs text-muted-foreground"
                    >
                      <Link href={jobUrl(job)}>
                        <span
                          className={`job-dot ${job.status.toLowerCase()}`}
                        />
                        <span>{job.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              {jobs.length === 0 && (
                <p className="px-2 py-4 text-xs leading-6 text-muted-foreground">
                  {user.role === "client"
                    ? "Create your first job and choose a freelancer."
                    : "Jobs assigned to your wallet will appear here."}
                </p>
              )}
              {user.role === "client" && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 w-full"
                  size="sm"
                >
                  <Link href="/jobs/new">
                    <Plus size={15} /> Create job
                  </Link>
                </Button>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-3 p-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="justify-start text-xs text-muted-foreground"
              >
                <BookOpen size={16} /> How payments work
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>From agreement to payment</DialogTitle>
                <DialogDescription>
                  The client funds the job before the freelancer begins.
                </DialogDescription>
              </DialogHeader>
              <ol className="space-y-4 py-3 text-sm leading-7">
                <li>
                  <strong>1. Agree and fund.</strong> The freelancer accepts the
                  proposal, then the client locks the agreed payment in escrow.
                </li>
                <li>
                  <strong>2. Deliver.</strong> The freelancer shares a
                  deliverable link and confirms submission with their wallet.
                </li>
                <li>
                  <strong>3. Verify the work.</strong> Client verification
                  releases payment to the freelancer in the same transaction.
                </li>
              </ol>
              <Alert>
                <AlertDescription>
                  New jobs use test USDC on Arc Testnet. Client verification
                  triggers payment. There is no refund, deadline, or dispute
                  action in the current contract.
                </AlertDescription>
              </Alert>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-auto w-full justify-between p-3"
              >
                <span className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-left">
                    <span className="block text-xs">My account</span>
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      {shortAddress(user.walletAddress)}
                    </span>
                  </span>
                </span>
                <ChevronUp size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-56">
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account">
                  <UserRound size={15} /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={signingOut}
                onSelect={() => void logout()}
              >
                <LogOut size={15} /> {signingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-center text-[10px] text-muted-foreground">
            {network.name} · {network.symbol} payments
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-17 shrink-0 items-center justify-between gap-4 border-b border-sidebar-border bg-background/90 backdrop-blur-md px-4 md:px-7">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4!" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  Workspace
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden text-[10px] sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400" />{" "}
              {network.name}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => void connect()}>
              <Wallet size={14} />
              {account ? shortAddress(account) : "Connect wallet"}
            </Button>
          </div>
        </header>
        {mismatch && (
          <Alert variant="destructive" className="mx-auto mt-4 max-w-4xl">
            <AlertDescription>
              Switch your wallet to {shortAddress(user.walletAddress)}, the
              address linked to this account, before making a payment.
            </AlertDescription>
          </Alert>
        )}
        <div id="main-content" className="flex-1">
          {children}
        </div>
        <footer className="mx-7 mt-8 flex items-center gap-2 border-t py-5 text-[10px] text-muted-foreground">
          <ShieldCheck size={13} /> FairPay · ETHGlobal Mumbai
        </footer>
      </SidebarInset>
      {notice && (
        <Alert
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex w-[min(540px,90vw)] -translate-x-1/2 items-center gap-3 shadow-xl"
        >
          <AlertDescription className="flex-1 text-xs leading-6">
            {notice}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => notify("")}
            aria-label="Dismiss message"
          >
            <X size={14} />
          </Button>
        </Alert>
      )}
    </SidebarProvider>
  );
}
