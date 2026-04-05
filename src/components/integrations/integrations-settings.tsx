"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ExternalLink, Trash2 } from "lucide-react";

interface IntegrationConfig {
  id: string;
  domain: string;
  email: string;
  jira_project_key?: string;
  confluence_space_key?: string;
}

interface Props {
  jira: IntegrationConfig | null;
  confluence: IntegrationConfig | null;
}

function IntegrationForm({
  type,
  existing,
  onSaved,
}: {
  type: "jira" | "confluence";
  existing: IntegrationConfig | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    domain: existing?.domain ?? "",
    email: existing?.email ?? "",
    api_token: "",
    jira_project_key: existing?.jira_project_key ?? "",
    confluence_space_key: existing?.confluence_space_key ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [error, setError] = useState("");

  const update = (k: string, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const resource = type === "jira" ? "projects" : "spaces";
      const res = await fetch(`/api/${type}?resource=${resource}`);
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!form.domain || !form.email || !form.api_token) {
      setError("Domain, email and API token are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/integrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    onSaved();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Atlassian Domain
          </label>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="yourcompany"
              value={form.domain}
              onChange={(e) => update("domain", e.target.value)}
              className="flex-1 border border-gray-200 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="px-3 py-2 bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-500">
              .atlassian.net
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          API Token{" "}
          <a
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
          >
            Generate one <ExternalLink size={10} />
          </a>
        </label>
        <input
          type="password"
          placeholder={existing ? "Leave blank to keep existing token" : "Paste your API token"}
          value={form.api_token}
          onChange={(e) => update("api_token", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {type === "jira" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Default JIRA Project Key (e.g. PROJ)
          </label>
          <input
            type="text"
            placeholder="PROJ"
            value={form.jira_project_key}
            onChange={(e) => update("jira_project_key", e.target.value.toUpperCase())}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {type === "confluence" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Default Confluence Space Key (e.g. TEAM)
          </label>
          <input
            type="text"
            placeholder="TEAM"
            value={form.confluence_space_key}
            onChange={(e) => update("confluence_space_key", e.target.value.toUpperCase())}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

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
    </div>
  );
}

export function IntegrationsSettings({ jira, confluence }: Props) {
  const [key, setKey] = useState(0);
  const refresh = () => setKey((k) => k + 1);

  return (
    <div key={key} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect your Atlassian tools to sync issues and docs.
        </p>
      </div>

      {/* JIRA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">J</span>
              </div>
              <div>
                <CardTitle>JIRA</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sync issues, import tasks, push updates
                </p>
              </div>
            </div>
            <Badge className={jira ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
              {jira ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <IntegrationForm type="jira" existing={jira} onSaved={refresh} />
        </CardContent>
      </Card>

      {/* Confluence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <div>
                <CardTitle>Confluence</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Push workspace docs to Confluence pages
                </p>
              </div>
            </div>
            <Badge className={confluence ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
              {confluence ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <IntegrationForm type="confluence" existing={confluence} onSaved={refresh} />
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardContent className="py-4">
          <p className="text-xs font-medium text-gray-700 mb-2">How to get your API token:</p>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Go to <strong>id.atlassian.com/manage-profile/security/api-tokens</strong></li>
            <li>Click <strong>Create API token</strong></li>
            <li>Name it anything (e.g. ProjectFlow) and copy the token</li>
            <li>Paste it above — works for both JIRA and Confluence</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
