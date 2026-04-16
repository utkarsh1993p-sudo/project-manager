"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ExternalLink, Trash2 } from "lucide-react";

interface SharePointConfig {
  id: string;
  domain: string;       // SharePoint site URL (e.g. contoso.sharepoint.com/sites/mysite)
  email: string;        // Tenant ID
  jira_project_key: string; // repurposed as Client ID
  confluence_space_key: string; // repurposed as library/drive name
}

interface SharePointPanelProps {
  existing: SharePointConfig | null;
  onSaved: () => void;
}

export function SharePointPanel({ existing, onSaved }: SharePointPanelProps) {
  const [form, setForm] = useState({
    siteUrl: existing?.domain ?? "",
    tenantId: existing?.email ?? "",
    clientId: existing?.jira_project_key ?? "",
    clientSecret: "",
    libraryName: existing?.confluence_space_key ?? "Documents",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!form.siteUrl || !form.tenantId || !form.clientId || (!existing && !form.clientSecret)) {
      setError("Site URL, Tenant ID and Client ID are required. Client Secret is required when connecting for the first time.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sharepoint",
          domain: form.siteUrl.trim(),
          email: form.tenantId.trim(),
          api_token: form.clientSecret || undefined,
          jira_project_key: form.clientId.trim(),
          confluence_space_key: form.libraryName.trim() || "Documents",
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sharepoint?resource=test");
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/integrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sharepoint" }),
    });
    onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <div>
              <CardTitle>SharePoint</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Sync documents and files with Microsoft SharePoint
              </p>
            </div>
          </div>
          <Badge className={existing ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
            {existing ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              SharePoint Site URL{" "}
              <a
                href="https://admin.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Find it <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="text"
              placeholder="contoso.sharepoint.com/sites/mysite"
              value={form.siteUrl}
              onChange={(e) => update("siteUrl", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tenant ID</label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.tenantId}
                onChange={(e) => update("tenantId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client ID (App ID)</label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.clientId}
                onChange={(e) => update("clientId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Client Secret{" "}
              <a
                href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Azure portal <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="password"
              placeholder={existing ? "Leave blank to keep existing secret" : "Paste your client secret"}
              value={form.clientSecret}
              onChange={(e) => update("clientSecret", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Document Library (default: Documents)
            </label>
            <input
              type="text"
              placeholder="Documents"
              value={form.libraryName}
              onChange={(e) => update("libraryName", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          {testResult === "ok" && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Connection successful!
            </p>
          )}
          {testResult === "fail" && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle size={14} /> Connection failed. Check your credentials.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : existing ? "Update" : "Connect"}
            </Button>
            {existing && (
              <>
                <Button variant="secondary" onClick={handleTest} disabled={testing}>
                  {testing ? "Testing..." : "Test Connection"}
                </Button>
                <Button variant="danger" size="sm" onClick={handleDisconnect}>
                  <Trash2 size={14} /> Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Setup guide */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-1.5">How to set up SharePoint access:</p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to <strong>portal.azure.com</strong> → App registrations → New registration</li>
              <li>Name it (e.g. ProjectFlow), set redirect URI to <code className="bg-gray-100 px-1 rounded">https://your-domain.com</code></li>
              <li>Under <strong>Certificates &amp; secrets</strong> → create a Client secret</li>
              <li>Under <strong>API permissions</strong> → add <code className="bg-gray-100 px-1 rounded">Sites.ReadWrite.All</code> (Microsoft Graph)</li>
              <li>Grant admin consent and paste credentials above</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
