import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  SALARY_PLACEHOLDER,
  careerSalaryLine,
  careerStartLabel,
  careers,
  getCareer,
  jobPostingJsonLd,
} from "./careers";

describe("career salary lines", () => {
  test("CMO base salary is formatted from the single EUR figure", () => {
    const cmo = getCareer("cmo");
    assert.ok(cmo);
    assert.equal(
      careerSalaryLine(cmo, "sk"),
      "Mzda: 3 240 € hrubého mesačne (základná zložka)",
    );
    assert.equal(
      careerSalaryLine(cmo, "en"),
      "Salary: €3,240 gross per month (base)",
    );
  });

  test("admin and developer salaries stay on the shared placeholder", () => {
    for (const slug of ["admin-assistant", "ai-developer"]) {
      const role = getCareer(slug);
      assert.ok(role);
      assert.equal(role.salary.kind, "placeholder");
      assert.equal(
        careerSalaryLine(role, "sk"),
        `Mzda: ${SALARY_PLACEHOLDER.sk}`,
      );
      assert.equal(
        careerSalaryLine(role, "en"),
        `Salary: ${SALARY_PLACEHOLDER.en}`,
      );
    }
  });
});

describe("career start labels", () => {
  test("CMO start date formats from the ISO value", () => {
    const cmo = getCareer("cmo");
    assert.ok(cmo);
    assert.equal(careerStartLabel(cmo, "sk"), "1. 1. 2027");
    assert.equal(careerStartLabel(cmo, "en"), "1 January 2027");
  });
});

describe("JobPosting JSON-LD", () => {
  test("includes baseSalary only when a figure exists", () => {
    const cmo = getCareer("cmo");
    const admin = getCareer("admin-assistant");
    const developer = getCareer("ai-developer");
    assert.ok(cmo && admin && developer);

    const cmoLd = JSON.parse(jobPostingJsonLd(cmo, "sk")) as {
      baseSalary: { value: { value: number; unitText: string } };
      description: string;
    };
    assert.equal(cmoLd.baseSalary.value.value, 3240);
    assert.equal(cmoLd.baseSalary.value.unitText, "MONTH");
    assert.match(cmoLd.description, /3 240/);

    for (const role of [admin, developer]) {
      const parsed = JSON.parse(jobPostingJsonLd(role, "sk")) as {
        baseSalary?: unknown;
        description: string;
      };
      assert.equal("baseSalary" in parsed, false);
      assert.match(parsed.description, /dohodou \/ TBD/);
    }
  });

  test("lists every open role", () => {
    assert.deepEqual(
      careers.map((role) => role.slug),
      ["cmo", "admin-assistant", "ai-developer"],
    );
  });
});
