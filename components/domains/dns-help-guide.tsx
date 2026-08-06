'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export const DNS_HELP_ANCHOR = 'dns-txt-help';
export const DNS_HELP_OPEN_EVENT = 'dns-help-open';

const REGISTRAR_GUIDES = [
  {
    name: 'Amazon Route 53',
    href: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html',
  },
  {
    name: 'Namecheap',
    href: 'https://www.namecheap.com/support/knowledgebase/article.aspx/1244/2234/google-workspace-domain-registered-with-namecheap-ownership-validation/#g',
  },
  {
    name: 'Bluehost',
    href: 'https://www.bluehost.com/help/article/dns-management-add-edit-or-delete-dns-entries#access',
  },
  {
    name: 'Shopify',
    href: 'https://help.shopify.com/en/manual/domains/managing-domains/edit-dns-settings',
  },
  {
    name: 'Cloudflare',
    href: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/',
  },
  {
    name: 'Squarespace',
    href: 'https://support.squarespace.com/hc/en-us/articles/217402917-Troubleshooting-Google-Workspace-domain-verification',
  },
  {
    name: 'GoDaddy',
    href: 'https://www.godaddy.com/help/add-a-txt-record-19232',
  },
  {
    name: 'Wix',
    href: 'https://support.wix.com/en/article/manually-verifying-your-domain-with-google-workspace-formerly-g-suite',
  },
  {
    name: 'Hostinger (cPanel)',
    href: 'https://support.hostinger.com/en/articles/4469063-how-to-add-and-remove-txt-records-in-cpanel',
  },
  {
    name: 'WordPress.com',
    href: 'https://wordpress.com/support/add-email/add-email-through-google-workspace/',
  },
] as const;

function hashMatches() {
  return window.location.hash === `#${DNS_HELP_ANCHOR}`;
}

export function DnsHelpGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function openFromHash() {
      if (hashMatches()) {
        setOpen(true);
      }
    }

    function openFromEvent() {
      setOpen(true);
    }

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    window.addEventListener(DNS_HELP_OPEN_EVENT, openFromEvent);
    return () => {
      window.removeEventListener('hashchange', openFromHash);
      window.removeEventListener(DNS_HELP_OPEN_EVENT, openFromEvent);
    };
  }, []);

  return (
    <section id={DNS_HELP_ANCHOR} className="scroll-mt-24 rounded-md border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <p className="text-sm tracking-tight">How to add the TXT record</p>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-5 border-t border-border px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            After you save the record at your registrar, wait for DNS to update. It can take up to{' '}
            <span className="font-medium text-foreground">72 hours</span> for the new TXT record to
            be recognized worldwide. Then return here and click{' '}
            <span className="font-medium text-foreground">Verify</span> again.
          </p>

          <div className="flex flex-col gap-3">
            <h3 className="text-base font-medium">General instructions</h3>
            <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                Sign in to the website where you manage your domain. This is where you change your
                domain&apos;s DNS records.
              </li>
              <li>
                Go to your domain&apos;s DNS settings. Look for something like{' '}
                <span className="text-foreground">DNS Records</span>,{' '}
                <span className="text-foreground">Domain Management</span>, or{' '}
                <span className="text-foreground">Name Server Management</span>.
              </li>
              <li>Find the TXT records section.</li>
              <li>
                Add a new TXT record using these values:
                <div className="mt-2 overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/40 text-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Field</th>
                        <th className="px-3 py-2 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border">
                        <td className="px-3 py-2 text-foreground">Type</td>
                        <td className="px-3 py-2 font-mono">TXT</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="px-3 py-2 text-foreground">Name / Host / Alias</td>
                        <td className="px-3 py-2">
                          Leave blank, or enter <span className="font-mono text-foreground">@</span>{' '}
                          for the apex domain. For a subdomain, enter only the subdomain label (e.g.{' '}
                          <span className="font-mono text-foreground">support</span>
                          ).
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-foreground">Value / Answer / Destination</td>
                        <td className="px-3 py-2">
                          Your unique ID from{' '}
                          <span className="font-medium text-foreground">Show TXT</span> on the
                          domain card. Example:{' '}
                          <span className="break-all font-mono text-foreground">
                            domain-verification=abcdefghi
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </li>
              <li>Save your new TXT record.</li>
              <li>
                Wait for the changes to take effect (up to 72 hours), then click Verify on the
                domain card.
              </li>
            </ol>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-base font-medium">Registrar guides</h3>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {REGISTRAR_GUIDES.map((guide) => (
                <li key={guide.href}>
                  <a
                    href={guide.href}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer text-emerald-700 underline-offset-4 hover:text-emerald-500 hover:underline"
                  >
                    {guide.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
