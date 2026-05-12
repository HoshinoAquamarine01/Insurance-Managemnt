// Component Examples & Showcase
// This file demonstrates how to use the design system components together
// Located at: frontend/src/app/components/examples/ComponentShowcase.tsx

import React from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";

/**
 * ===== BUTTON EXAMPLES =====
 */
export function ButtonShowcase() {
  return (
    <div className="space-y-lg">
      {/* Primary Actions */}
      <div>
        <h3 className="text-h3 mb-md">Primary Buttons</h3>
        <div className="flex gap-md flex-wrap">
          <Button variant="primary">Create Contract</Button>
          <Button variant="primary" size="lg">
            Large Button
          </Button>
          <Button variant="primary" size="sm">
            Small Button
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" isLoading>
            Processing...
          </Button>
        </div>
      </div>

      {/* Secondary Actions */}
      <div>
        <h3 className="text-h3 mb-md">Secondary Buttons</h3>
        <div className="flex gap-md flex-wrap">
          <Button variant="secondary">Cancel</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Style</Button>
        </div>
      </div>

      {/* Status Buttons */}
      <div>
        <h3 className="text-h3 mb-md">Status Buttons</h3>
        <div className="flex gap-md flex-wrap">
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="destructive">Delete Action</Button>
          <Button variant="destructive" disabled>
            Cannot Delete
          </Button>
        </div>
      </div>

      {/* Icon Buttons */}
      <div>
        <h3 className="text-h3 mb-md">Icon Buttons</h3>
        <div className="flex gap-md flex-wrap">
          <Button variant="ghost" size="icon" aria-label="Search">
            🔍
          </Button>
          <Button variant="ghost" size="icon_sm" aria-label="Close">
            ✕
          </Button>
          <Button variant="primary" size="icon_lg" aria-label="Add">
            ➕
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * ===== BADGE EXAMPLES =====
 */
export function BadgeShowcase() {
  return (
    <div className="space-y-lg">
      <h3 className="text-h3">Status Badges</h3>

      <div className="flex gap-md flex-wrap items-center">
        <Badge variant="success">Active ✓</Badge>
        <Badge variant="warning">Pending ⏳</Badge>
        <Badge variant="error">Failed ✗</Badge>
        <Badge variant="pending">Awaiting Approval</Badge>
        <Badge variant="expired">Expired</Badge>
        <Badge variant="info">New Contract</Badge>
      </div>

      <h3 className="text-h3 mt-lg">Role Badges</h3>
      <div className="flex gap-md flex-wrap items-center">
        <Badge variant="creator">Creator</Badge>
        <Badge variant="accountant">Accountant</Badge>
        <Badge variant="supervisor">Supervisor</Badge>
        <Badge variant="admin">Administrator</Badge>
      </div>
    </div>
  );
}

/**
 * ===== CARD EXAMPLES =====
 */
export function CardShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      {/* Basic Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
          <CardDescription>Active health insurance policy</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-small text-muted">Contract ID</p>
          <p className="text-body-lg text-strong">HĐ-2024-001234</p>
        </CardContent>
      </Card>

      {/* Contract Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>HĐ-2024-001235</CardTitle>
              <CardDescription>Nguyễn Văn A</CardDescription>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-md">
          <div>
            <p className="text-small text-muted">Type</p>
            <p className="text-body">Health Insurance - Premium</p>
          </div>
          <div>
            <p className="text-small text-muted">Amount</p>
            <p className="text-h3 text-strong">₫50,000,000</p>
          </div>
          <div>
            <p className="text-small text-muted">Expires</p>
            <p className="text-body">June 30, 2025</p>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full flex gap-sm">
            <Button variant="primary" size="sm">
              View Details
            </Button>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Payment Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Due</CardTitle>
        </CardHeader>
        <CardContent className="space-y-md">
          <div>
            <p className="text-h2 text-strong">₫5,000,000</p>
            <p className="text-small text-muted">Q2 2024</p>
          </div>
          <div>
            <p className="text-small text-muted">Due Date</p>
            <div className="flex items-center gap-sm">
              <p className="text-body-lg">May 31, 2024</p>
              <Badge variant="warning">⚠️ Due Soon</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="primary" className="w-full">
            Pay Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * ===== DATA TABLE EXAMPLE =====
 */
export function TableShowcase() {
  const contracts = [
    {
      id: "HĐ-2024-001234",
      name: "Nguyễn Văn A",
      type: "Health",
      amount: 50000000,
      status: "active" as const,
    },
    {
      id: "HĐ-2024-001235",
      name: "Trần Thị B",
      type: "Life",
      amount: 100000000,
      status: "pending" as const,
    },
    {
      id: "HĐ-2024-001236",
      name: "Lê Văn C",
      type: "Health",
      amount: 30000000,
      status: "expired" as const,
    },
  ];

  return (
    <div>
      <h3 className="text-h3 mb-lg">Contracts List</h3>
      <table className="table-container">
        <thead className="table-header">
          <tr>
            <th>Contract ID</th>
            <th>Insured Name</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => {
            const statusVariant =
              contract.status === "active"
                ? "success"
                : contract.status === "pending"
                  ? "warning"
                  : "expired";

            return (
              <tr key={contract.id} className="table-row">
                <td className="text-mono font-semibold">{contract.id}</td>
                <td>{contract.name}</td>
                <td>{contract.type}</td>
                <td className="text-mono">
                  ₫{contract.amount.toLocaleString("vi-VN")}
                </td>
                <td>
                  <Badge variant={statusVariant}>
                    {contract.status === "active"
                      ? "✓ Active"
                      : contract.status === "pending"
                        ? "⏳ Pending"
                        : "⊘ Expired"}
                  </Badge>
                </td>
                <td>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * ===== EMPTY STATE EXAMPLE =====
 */
export function EmptyStateShowcase() {
  return (
    <div className="flex-center flex-col gap-lg py-2xl">
      <div style={{ fontSize: "72px" }}>📋</div>
      <div className="text-center max-w-md">
        <h3 className="text-h3 mb-md">No Contracts Found</h3>
        <p className="text-body text-muted mb-lg">
          You haven't created any contracts yet. Start by creating your first
          insurance policy.
        </p>
        <Button variant="primary" size="lg">
          Create First Contract →
        </Button>
      </div>
    </div>
  );
}

/**
 * ===== FORM ELEMENTS EXAMPLE =====
 */
export function FormShowcase() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Create New Contract</CardTitle>
        <CardDescription>
          Fill in the details below to create a new insurance contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-md">
        <div>
          <label
            htmlFor="contract-type"
            className="text-small font-semibold block mb-sm"
          >
            Insurance Type
          </label>
          <select
            id="contract-type"
            className="input-field w-full"
            defaultValue="health"
          >
            <option value="">Select a type...</option>
            <option value="health">Health Insurance</option>
            <option value="life">Life Insurance</option>
            <option value="auto">Auto Insurance</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="insured-name"
            className="text-small font-semibold block mb-sm"
          >
            Insured Person
          </label>
          <input
            id="insured-name"
            type="text"
            className="input-field w-full"
            placeholder="Enter name..."
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="text-small font-semibold block mb-sm"
          >
            Coverage Amount (VNĐ)
          </label>
          <input
            id="amount"
            type="number"
            className="input-field w-full"
            placeholder="50,000,000"
          />
        </div>

        <div>
          <label className="flex items-center gap-md">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-small">
              I agree to the terms and conditions
            </span>
          </label>
        </div>
      </CardContent>
      <CardFooter className="gap-md">
        <Button variant="secondary" className="flex-1">
          Cancel
        </Button>
        <Button variant="primary" className="flex-1">
          Create Contract
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * ===== COLOR PALETTE SHOWCASE =====
 */
export function ColorPaletteShowcase() {
  const colors = [
    { name: "Brand Teal", hex: "#0d9488", var: "--color-brand-600" },
    { name: "Success Green", hex: "#10b981", var: "--color-success" },
    { name: "Warning Amber", hex: "#f59e0b", var: "--color-warning" },
    { name: "Error Red", hex: "#ef4444", var: "--color-error" },
    { name: "Info Blue", hex: "#3b82f6", var: "--color-info" },
    { name: "Creator Orange", hex: "#f97316", var: "--color-creator" },
    { name: "Accountant Purple", hex: "#8b5cf6", var: "--color-accountant" },
    { name: "Supervisor Indigo", hex: "#6366f1", var: "--color-supervisor" },
    { name: "Neutral Gray", hex: "#6b7280", var: "--color-neutral-500" },
  ];

  return (
    <div>
      <h3 className="text-h3 mb-lg">Color Palette</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
        {colors.map((color) => (
          <div key={color.hex} className="text-center">
            <div
              className="w-full h-24 rounded-lg shadow-md mb-md transition-transform hover:scale-105"
              style={{ backgroundColor: color.hex }}
              title={`${color.name} - ${color.hex}`}
            />
            <p className="text-small font-semibold">{color.name}</p>
            <p className="text-xs text-muted font-mono">{color.hex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ===== TYPOGRAPHY SHOWCASE =====
 */
export function TypographyShowcase() {
  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-h1">H1 - Page Title (32px, 700 weight)</h1>
        <p className="text-small text-muted">Used for main page headings</p>
      </div>

      <div>
        <h2 className="text-h2">H2 - Section Heading (24px, 600 weight)</h2>
        <p className="text-small text-muted">Used for section dividers</p>
      </div>

      <div>
        <h3 className="text-h3">H3 - Subsection (20px, 600 weight)</h3>
        <p className="text-small text-muted">Used for card titles and groups</p>
      </div>

      <div>
        <p className="text-body-lg">
          Body Large (16px, 400 weight) - Main content text, table cells, larger
          paragraphs
        </p>
      </div>

      <div>
        <p className="text-body">
          Body Regular (14px, 400 weight) - Secondary content, labels,
          descriptions
        </p>
      </div>

      <div>
        <p className="text-small">
          Small (12px, 500 weight) - Badges, metadata, captions, helper text
        </p>
      </div>

      <div>
        <p className="text-mono">
          Monospace (13px, 400 weight) - Contract IDs, amounts, codes
        </p>
      </div>
    </div>
  );
}

/**
 * ===== SPACING GRID SHOWCASE =====
 */
export function SpacingShowcase() {
  const spacings = [
    { name: "xs (4px)", value: "xs" },
    { name: "sm (8px)", value: "sm" },
    { name: "md (16px)", value: "md" },
    { name: "lg (24px)", value: "lg" },
    { name: "xl (32px)", value: "xl" },
    { name: "2xl (48px)", value: "2xl" },
  ];

  return (
    <div>
      <h3 className="text-h3 mb-lg">Spacing System (4px Grid)</h3>
      <div className="space-y-lg">
        {spacings.map((spacing) => (
          <div key={spacing.value} className="flex items-center gap-md">
            <div className="w-32 text-small font-semibold text-muted">
              {spacing.name}
            </div>
            <div
              className="bg-brand-600 rounded-md"
              style={{
                width: `var(--spacing-${spacing.value})`,
                height: `var(--spacing-${spacing.value})`,
              }}
            />
            <div
              className="bg-brand-200 rounded-md"
              style={{
                width: `var(--spacing-${spacing.value})`,
                height: "24px",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ===== MAIN SHOWCASE PAGE =====
 */
export function ComponentShowcase() {
  return (
    <div className="space-y-2xl py-lg">
      <section>
        <h2 className="text-h1 mb-lg">Design System Component Showcase</h2>
        <p className="text-body-lg text-muted mb-2xl max-w-2xl">
          Complete visual reference for all available components following the
          QLBH Insurance Platform design system.
        </p>
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Buttons</h2>
        <ButtonShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Badges & Status Indicators</h2>
        <BadgeShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Cards</h2>
        <CardShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Data Tables</h2>
        <TableShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Empty States</h2>
        <EmptyStateShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Forms</h2>
        <FormShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Typography</h2>
        <TypographyShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Color Palette</h2>
        <ColorPaletteShowcase />
      </section>

      <section className="space-y-lg">
        <h2 className="text-h2">Spacing System</h2>
        <SpacingShowcase />
      </section>
    </div>
  );
}

export default ComponentShowcase;
