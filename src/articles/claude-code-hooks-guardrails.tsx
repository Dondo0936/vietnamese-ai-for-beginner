import {
  ArticleCompare,
  ArticleProse,
  ArticleSection,
  ArticleShell,
  ArticleStat,
  ArticleViz,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["claude-code-hooks-guardrails"]!;

export default function ClaudeCodeHooksGuardrailsArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<ClaudeHooksHeroViz />}>
      <ArticleSection
        eyebrow="01 · Tình huống"
        heading="Agent không chỉ viết chữ. Agent chạm vào máy thật"
      >
        <ArticleProse>
          <p>
            Bạn giao Claude Code sửa một module deploy. Nó đọc repo, tạo plan,
            rồi chuẩn bị chạy <code>rm -rf /tmp/build</code> để dọn build cũ.
            Nếu lệnh đúng thư mục, không sao. Nếu biến path bị rỗng, hoặc
            prompt injection trong file log làm agent đổi mục tiêu, bạn không
            muốn phát hiện chuyện đó sau khi tool đã chạy.
          </p>
          <p>
            Vì vậy guardrails engineering cho coding agent không thể dừng ở
            system prompt. Prompt là lời dặn. Hook là điểm kiểm tra ở runtime,
            nằm đúng chỗ agent sắp gọi tool. Nó nhìn thấy{" "}
            <Term slug="function-calling">Tool use</Term> đã được model tạo
            ra, đọc JSON đầu vào, rồi cho đi tiếp, hỏi lại, hoặc chặn.
          </p>
        </ArticleProse>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            margin: "8px 0",
          }}
        >
          <ArticleStat value="PreToolUse" label="chạy trước Tool use" />
          <ArticleStat value="exit 2" label="tín hiệu block bằng exit code" />
          <ArticleStat value="JSON" label="ngữ cảnh vào hook qua stdin" />
          <ArticleStat value="0" label="silent success không phải approval" />
        </div>
        <ArticleViz caption="Điểm khác biệt chính: hook đứng ở rìa hành động, không đứng trong lời nhắc.">
          <HookBoundaryViz />
        </ArticleViz>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Một hook là cổng kiểm soát trong lifecycle"
      >
        <ArticleProse>
          <p>
            Theo tài liệu Claude Code, hooks là các handler do người dùng định
            nghĩa. Handler có thể là <code>command</code>, HTTP endpoint, MCP
            tool, prompt, hoặc agent. Chúng chạy tự động tại các event của
            Claude Code: bắt đầu session, nhận prompt, trước tool, sau tool,
            trước khi stop, trước khi compact, và vài điểm khác trong vòng đời
            agent.
          </p>
          <p>
            Với guardrails engineering, event quan trọng nhất thường là{" "}
            <code>PreToolUse</code>. Nó chạy sau khi Claude đã tạo tham số cho
            tool, nhưng trước khi tool thực thi. Nghĩa là hook thấy đủ chi tiết
            để kiểm policy, nhưng vẫn còn kịp chặn tác động.
          </p>
        </ArticleProse>
        <LifecycleViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · PreToolUse"
        heading="Từ Tool use sang quyết định deny"
      >
        <ArticleProse>
          <p>
            Command hook nhận JSON qua <code>stdin</code>. Với Bash, JSON có
            thể chứa <code>tool_name: &quot;Bash&quot;</code> và{" "}
            <code>tool_input.command</code>. Với Write hoặc Edit, nó chứa{" "}
            <code>file_path</code> và nội dung liên quan. Đây là dữ liệu mà
            policy script cần, không phải một đoạn chat đã bị diễn giải lại.
          </p>
          <p>
            Có hai cách ra quyết định. Cách nhanh: in lý do ra{" "}
            <code>stderr</code> và <code>exit 2</code>. Với{" "}
            <code>PreToolUse</code>, điều này block Tool use. Cách có cấu
            trúc hơn: <code>exit 0</code> và in một JSON có{" "}
            <code>hookSpecificOutput.permissionDecision</code>, ví dụ{" "}
            <code>deny</code>, <code>ask</code>, hoặc <code>allow</code>.
            Không trộn hai kiểu này, vì Claude Code chỉ đọc JSON khi hook
            thoát bằng code 0.
          </p>
        </ArticleProse>
        <HookResolutionViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Guardrails engineering"
        heading="Policy tốt là policy hẹp, test được, có log"
      >
        <ArticleProse>
          <p>
            Một hook tốt không cố đoán ý định của model bằng cảm tính. Nó kiểm
            các điều kiện rõ: tool nào, file nào, command nào, path nào, mode
            nào, và có bằng chứng gì trong repo. Càng gần filesystem và shell,
            policy càng nên deterministic.
          </p>
          <p>
            Đây là chỗ hook khác với moderation chung. Moderation thường hỏi:
            nội dung này có an toàn không. Runtime hook hỏi câu hẹp hơn: thao
            tác này, với input này, tại thư mục này, có được phép chạy ngay bây
            giờ không.
          </p>
        </ArticleProse>
        <ArticleCompare
          before={{
            label: "Prompt-only guardrail",
            value: "Mong agent nhớ luật",
            note: "Dễ bị quên khi context dài, Tool use phức tạp, hoặc prompt injection nằm trong file.",
          }}
          after={{
            label: "Runtime guardrail",
            value: "Chặn tại điểm gọi tool",
            note: "Policy nhìn input thật, trả lý do rõ, và để lại audit trail cho team.",
          }}
        />
        <GuardrailMatrixViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Pattern thực chiến"
        heading="Những hook đáng viết đầu tiên"
      >
        <ArticleProse>
          <p>
            Nếu một team mới bắt đầu dùng Claude Code cho repo thật, tôi sẽ
            không viết hook quá thông minh ngay. Bắt đầu bằng những cổng đơn
            giản nhưng có giá trị cao: chặn protected paths, chặn command nguy
            hiểm, quét secret trước khi Write, ép test sau Edit, và chặn MCP
            tool ghi dữ liệu ngoài allowlist.
          </p>
          <p>
            Matcher giúp giảm nhiễu: <code>Bash</code> chỉ match tool Bash,
            còn <code>Edit|Write</code> match chính xác hai tool Edit và Write.
            Với MCP tool, tên thường có dạng{" "}
            <code>mcp__server__tool</code>, nên muốn match mọi tool từ một
            server cần pattern kiểu <code>mcp__memory__.*</code>, không phải
            chỉ <code>mcp__memory</code>.
          </p>
        </ArticleProse>
        <PracticalPatternsViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Bẫy kỹ thuật"
        heading="Không phải hook nào cũng chặn được"
      >
        <ArticleProse>
          <p>
            <code>PostToolUse</code> chạy sau khi tool đã thành công. Nó hữu
            ích để log, chạy lint, kiểm diff, hoặc yêu cầu agent sửa lỗi sau
            khi test fail. Nhưng nó không thể đảo ngược việc file vừa bị ghi.
            Async hook còn rõ hơn: nó chạy nền, Claude tiếp tục làm việc, nên
            không dùng để block.
          </p>
          <p>
            Điểm nguy hiểm khác nằm trong chính hook. Command hook chạy với
            quyền user hệ thống. Nếu script hook xử lý path không chặt, không
            quote biến shell, hoặc tin dữ liệu JSON mù quáng, guardrail sẽ biến
            thành bề mặt tấn công mới.
          </p>
        </ArticleProse>
        <AsyncAndRiskViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="07 · Thiết kế đội nhóm"
        heading="Guardrail phải sống cùng repo, không sống trong trí nhớ"
      >
        <ArticleProse>
          <p>
            Claude Code cho phép đặt hook ở user settings, project settings,
            local settings, managed policy, plugin, skill, hoặc agent
            frontmatter. Với team, phần dùng chung nên nằm trong project hoặc
            managed policy, còn thử nghiệm cá nhân nằm ở local settings. Đừng
            để policy quan trọng chỉ tồn tại trong một máy developer.
          </p>
          <p>
            Mapping rộng hơn cũng khá rõ. Trong OWASP Top 10 for LLM
            Applications v1.1, prompt injection, insecure output handling,
            sensitive information disclosure, insecure plugin design, và
            excessive agency đều là rủi ro lớn của LLM app. NIST AI RMF thì đặt
            trọng tâm vào quản trị, đo lường, và quản lý rủi ro. Hooks không
            thay thế hai khung đó, nhưng biến một phần policy thành code chạy
            được trong workflow hằng ngày.
          </p>
        </ArticleProse>
        <TeamRolloutViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="08 · Quy mô production"
        heading="Công ty lớn không đặt một cổng. Họ xếp nhiều lớp guardrail"
      >
        <ArticleProse>
          <p>
            Hook bạn vừa viết canh một máy, một repo. Nhưng một hệ thống AI
            phục vụ hàng triệu người dùng, ví dụ chatbot hỗ trợ, copilot trong
            sản phẩm, hay agent tự động gọi API, thì không thể tin vào một
            checkpoint duy nhất. Vì vậy các công ty lớn dựng guardrail theo kiểu
            defense in depth: nhiều lớp xếp nối nhau, lớp sau bắt cái lớp trước
            bỏ lọt.
          </p>
          <p>
            Các lớp đó rơi vào ba nhóm. <b>Input guardrail</b> chạy trước khi
            model đọc prompt: lọc nội dung độc hại, phát hiện{" "}
            <Term slug="prompt-injection-defense">prompt injection</Term> và
            jailbreak, che thông tin nhạy cảm như PII. <b>Output guardrail</b>{" "}
            chạy trước khi câu trả lời đến tay người dùng hoặc hệ thống tiếp
            theo: kiểm nội dung, validate đúng schema, đối chiếu câu trả lời với
            nguồn để bắt hallucination, và redact dữ liệu lộ ra.{" "}
            <b>Action guardrail</b> chạy ngay trước khi một tool thực thi. Đây
            chính là ý tưởng của <code>PreToolUse</code> hook, nhưng ở quy mô
            service và thường kèm một người duyệt cho thao tác rủi ro cao.
          </p>
          <p>
            Điểm chung là họ coi guardrail như production code thật. Policy được
            version trong repo, có eval suite chạy thử trên tập case đã gán nhãn,
            có red team tấn công thử để tìm lỗ hổng, và có observability để theo
            dõi khi đã chạy thật: log, trace, metric, và một đường báo sự cố khi
            guardrail chặn nhầm hoặc bỏ lọt. Vài bộ công cụ phổ biến cho hướng
            này là Llama Guard, NeMo Guardrails, OpenAI Moderation API,
            Guardrails AI và Azure AI Content Safety.
          </p>
        </ArticleProse>
        <ArticleCompare
          before={{
            label: "Một cổng",
            value: "Hook trên máy bạn",
            note: "Đủ cho một repo, một developer. Nhưng chỉ canh đúng điểm gọi tool, không thấy input độc hại hay output sai.",
          }}
          after={{
            label: "Defense in depth",
            value: "Nhiều lớp ở production",
            note: "Input, output và action mỗi lớp một việc. Lớp sau bắt cái lớp trước bỏ lọt, và mọi lớp đều có log để audit.",
          }}
        />
        <ProductionLayersViz />
      </ArticleSection>

      <ArticleSection
        eyebrow="09 · Checklist"
        heading="Cách viết hook không tự làm hệ thống yếu đi"
      >
        <ArticleProse>
          <p>
            Một guardrail hook tốt nên trả lời được bốn câu hỏi: nó bảo vệ tài
            sản nào, nó match đúng event nào, nó block dựa trên dữ liệu nào,
            và người đọc log có hiểu vì sao bị block không. Nếu không trả lời
            được, hook đó thường là noise.
          </p>
          <p>
            Nguồn nền cho bài viết:{" "}
            <a
              href="https://code.claude.com/docs/en/hooks"
              target="_blank"
              rel="noopener noreferrer"
            >
              Claude Code Hooks reference
            </a>
            ,{" "}
            <a
              href="https://code.claude.com/docs/en/hooks-guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              Automate workflows with hooks
            </a>
            ,{" "}
            <a
              href="https://owasp.org/www-project-top-10-for-large-language-model-applications/"
              target="_blank"
              rel="noopener noreferrer"
            >
              OWASP Top 10 for LLM Applications
            </a>
            , và{" "}
            <a
              href="https://www.nist.gov/itl/ai-risk-management-framework"
              target="_blank"
              rel="noopener noreferrer"
            >
              NIST AI RMF
            </a>
            .
          </p>
        </ArticleProse>
        <ChecklistViz />
      </ArticleSection>
    </ArticleShell>
  );
}

export function ClaudeHooksHeroViz() {
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Claude Code Tool use passes through a PreToolUse hook before reaching shell and file tools"
    >
      <defs>
        <linearGradient id="hooks-hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--bg-card)" />
          <stop offset="58%" stopColor="var(--paper-2)" />
          <stop offset="100%" stopColor="var(--turquoise-50)" />
        </linearGradient>
        <linearGradient id="hooks-hero-flow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--turquoise-500)" />
          <stop offset="52%" stopColor="var(--peach-500)" />
          <stop offset="100%" stopColor="var(--text-primary)" />
        </linearGradient>
        <marker
          id="hooks-hero-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M2 2 L10 6 L2 10 Z" fill="var(--text-primary)" />
        </marker>
        <marker
          id="hooks-hero-deny-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M2 2 L10 6 L2 10 Z" fill="var(--clay)" />
        </marker>
      </defs>
      <rect width="900" height="340" rx="22" fill="url(#hooks-hero-bg)" />
      <GridDots />

      <path
        d="M214 170 H306"
        stroke="url(#hooks-hero-flow)"
        strokeWidth="8"
        strokeLinecap="round"
        markerEnd="url(#hooks-hero-arrow)"
      />
      <path
        d="M506 142 C560 106 590 116 626 130"
        stroke="url(#hooks-hero-flow)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        markerEnd="url(#hooks-hero-arrow)"
      />
      <path
        d="M506 192 C560 226 590 216 626 204"
        fill="none"
        stroke="var(--clay)"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.88"
        markerEnd="url(#hooks-hero-deny-arrow)"
      />
      <path
        d="M406 204 V244"
        fill="none"
        stroke="var(--text-primary)"
        strokeWidth="6"
        strokeLinecap="round"
        markerEnd="url(#hooks-hero-arrow)"
      />

      <HeroFlowLabel x={244} y={148} text="JSON" />
      <HeroFlowLabel x={560} y={94} text="allow" />
      <HeroFlowLabel x={558} y={232} text="deny" tone="deny" />
      <HeroFlowLabel x={422} y={230} text="log" />

      <HeroCard x={46} y={96} width={170} title="Tool use JSON" note="Bash rm -rf" tone="dark" />
      <HeroCard x={306} y={82} width={204} title="PreToolUse" note="đọc JSON trước" tone="gate" />
      <HeroCard x={628} y={76} width={210} title="Allow" note="Bash / Write chạy" tone="tool" />
      <HeroCard x={628} y={188} width={210} title="Deny" note="tool không chạy" tone="deny" />
      <HeroCard x={314} y={246} width={184} height={70} title="Audit log" note="luật + lý do" tone="log" />
    </svg>
  );
}

function HookBoundaryViz() {
  const steps = [
    ["Prompt", "ý định bằng chữ", "var(--graphite)"],
    ["Tool use", "tham số cụ thể", "var(--turquoise-500)"],
    ["Hook", "policy runtime", "var(--peach-500)"],
    ["Action", "filesystem, shell, MCP", "var(--text-primary)"],
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 12,
      }}
    >
      {steps.map(([title, note, color], index) => (
        <div
          key={title}
          style={{
            minHeight: 138,
            border: "1px solid var(--border)",
            borderTop: `5px solid ${color}`,
            borderRadius: 14,
            background: "var(--bg-card)",
            padding: 16,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "var(--paper-2)",
              color: "var(--text-primary)",
              fontWeight: 800,
              marginBottom: 18,
            }}
          >
            {index + 1}
          </div>
          <b style={{ color: "var(--text-primary)", fontSize: 20 }}>{title}</b>
          <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {note}
          </p>
        </div>
      ))}
    </div>
  );
}

function LifecycleViz() {
  const events = [
    ["SessionStart", "nạp ngữ cảnh"],
    ["UserPromptSubmit", "kiểm prompt"],
    ["PreToolUse", "chặn trước tool"],
    ["PermissionRequest", "duyệt quyền"],
    ["PostToolUse", "log sau tool"],
    ["PostToolBatch", "ngắt vòng lặp"],
    ["Stop", "kiểm hoàn tất"],
  ];

  return (
    <ArticleViz caption="Lifecycle có nhiều event. Với hành động có side effect, PreToolUse là cổng sớm nhất sau khi tool input đã rõ.">
      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            minWidth: 760,
            display: "grid",
            gridTemplateColumns: `repeat(${events.length}, 1fr)`,
            gap: 10,
            alignItems: "stretch",
          }}
        >
          {events.map(([name, note], index) => (
            <div
              key={name}
              style={{
                position: "relative",
                minHeight: 150,
                padding: 14,
                border: "1px solid var(--border)",
                borderRadius: 14,
                background:
                  name === "PreToolUse" ? "var(--turquoise-50)" : "var(--bg-card)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 18,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontSize: name === "PreToolUse" ? 20 : 16,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  lineHeight: 1.12,
                }}
              >
                {name}
              </div>
              <p
                style={{
                  margin: "10px 0 0",
                  color: name === "PreToolUse" ? "var(--text-primary)" : "var(--text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                {note}
              </p>
              {name === "PreToolUse" && (
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    padding: "4px 8px",
                    borderRadius: 8,
                    background: "var(--turquoise-500)",
                    color: "var(--paper)",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  blockable
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
        }}
      >
        {["tool input rõ", "PreToolUse", "allow / deny", "tool chạy hoặc dừng"].map(
          (step, index) => (
            <div
              key={step}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: index === 1 ? "var(--turquoise-50)" : "var(--bg-card)",
                color: "var(--text-primary)",
                padding: "10px 12px",
                fontWeight: 800,
                display: "grid",
                gridTemplateColumns: "24px 1fr",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  background: index === 1 ? "var(--turquoise-500)" : "var(--paper-2)",
                  color: index === 1 ? "var(--paper)" : "var(--text-primary)",
                  fontSize: 12,
                }}
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ),
        )}
      </div>
    </ArticleViz>
  );
}

function HookResolutionViz() {
  return (
    <ArticleViz caption="Exit 2 là kiểu block nhanh. JSON decision dùng exit 0 để Claude Code parse stdout.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: 16,
        }}
      >
        <CodePanel
          title="input vào hook"
          lines={[
            '{',
            '  "hook_event_name": "PreToolUse",',
            '  "tool_name": "Bash",',
            '  "tool_input": {',
            '    "command": "rm -rf /tmp/build"',
            "  }",
            "}",
          ]}
        />
        <div style={{ display: "grid", gap: 12 }}>
          <DecisionCard
            title="Allow"
            value="tool được chạy"
            note="Chỉ dùng khi policy đã kiểm đủ tool, command, path và cwd."
            tone="allow"
          />
          <DecisionCard
            title="Deny"
            value="tool không chạy"
            note="Có thể block nhanh bằng stderr + exit 2 hoặc trả JSON deny."
            tone="deny"
          />
          <DecisionCard
            title="Ask"
            value="đẩy về permission flow"
            note="Dùng khi hook thấy rủi ro nhưng cần user hoặc policy khác quyết định."
            tone="ask"
          />
          <DecisionCard
            title="Log"
            value="ghi luật + lý do"
            note="Log đủ để audit, nhưng phải tránh lộ secret trong input."
            tone="neutral"
          />
        </div>
      </div>
    </ArticleViz>
  );
}

function GuardrailMatrixViz() {
  const rows = [
    ["Protected paths", ".env, secrets, prod config", "deny Write/Edit"],
    ["Dangerous shell", "rm -rf, chmod 777, curl | sh", "deny Bash"],
    ["Secret leakage", "API key trong diff", "block commit hoặc Write"],
    ["MCP write scope", "write tool ngoài allowlist", "deny MCP write"],
    ["Post-edit quality", "test fail sau Edit", "PostToolUse feedback"],
  ];

  return (
    <ArticleViz caption="Bảng thiết kế guardrail: asset trước, event sau, rồi mới viết script.">
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map(([asset, signal, action]) => (
          <div
            key={asset}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr 1fr",
              gap: 12,
              alignItems: "center",
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--bg-card)",
              padding: 14,
            }}
          >
            <b style={{ color: "var(--text-primary)" }}>{asset}</b>
            <span style={{ color: "var(--text-secondary)" }}>{signal}</span>
            <span
              style={{
                justifySelf: "start",
                borderRadius: 8,
                padding: "5px 9px",
                color: "var(--text-primary)",
                background: "var(--paper-2)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
            >
              {action}
            </span>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

function PracticalPatternsViz() {
  const cards = [
    ["Path guard", "Edit|Write", "chặn .env, credentials, prompts prod"],
    ["Shell guard", "Bash", "deny rm *, curl | sh, sudo ngoài allowlist"],
    ["Network guard", "WebFetch", "giới hạn domain khi xử lý dữ liệu nhạy cảm"],
    ["MCP guard", "mcp__.*", "chặn write tool ngoài server đã duyệt"],
    ["Verifier", "PostToolUse", "chạy test, lint, typecheck sau thay đổi"],
    ["Stop guard", "Stop", "không cho dừng khi checklist chưa xong"],
  ];

  return (
    <ArticleViz caption="Một bộ hook nhỏ, rõ, thường tốt hơn một policy khổng lồ khó debug.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 12,
        }}
      >
        {cards.map(([title, matcher, note]) => (
          <div
            key={title}
            style={{
              minHeight: 146,
              border: "1px solid var(--border)",
              borderRadius: 14,
              background: "var(--bg-card)",
              padding: 16,
            }}
          >
            <span
              style={{
                display: "inline-block",
                borderRadius: 8,
                background: "var(--turquoise-50)",
                color: "var(--text-primary)",
                fontWeight: 800,
                padding: "4px 8px",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                marginBottom: 18,
              }}
            >
              {matcher}
            </span>
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 20 }}>
              {title}
            </div>
            <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {note}
            </p>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

function AsyncAndRiskViz() {
  return (
    <ArticleViz caption="Sync hook là cổng chặn. Async hook là luồng quan sát hoặc kiểm chứng chạy sau.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <LaneCard
          title="Sync PreToolUse"
          steps={["tool input", "policy check", "deny hoặc allow", "tool chạy"]}
          accent="var(--turquoise-500)"
        />
        <LaneCard
          title="Async PostToolUse"
          steps={["file đã đổi", "test chạy nền", "kết quả quay lại sau", "không block được"]}
          accent="var(--peach-500)"
        />
      </div>
      <div
        style={{
          marginTop: 16,
          border: "1px solid var(--border)",
          borderRadius: 14,
          background: "var(--paper-2)",
          padding: 16,
          color: "var(--text-primary)",
        }}
      >
        <b>Quy tắc an toàn cho command hook:</b>{" "}
        <span style={{ color: "var(--text-secondary)" }}>
          validate input, quote biến shell, chặn path traversal, dùng absolute
          path, bỏ qua file nhạy cảm.
        </span>
      </div>
    </ArticleViz>
  );
}

function TeamRolloutViz() {
  const layers = [
    ["Local", ".claude/settings.local.json", "thử nghiệm cá nhân"],
    ["Project", ".claude/settings.json", "policy chung của repo"],
    ["Plugin", "hooks/hooks.json", "đóng gói toolchain"],
    ["Managed", "policy settings", "chuẩn tổ chức"],
  ];

  return (
    <ArticleViz caption="Đừng nhét mọi thứ vào máy cá nhân. Policy quan trọng cần scope rõ và review như code.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
        }}
      >
        {layers.map(([name, path, note], index) => (
          <div
            key={name}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              background: index === layers.length - 1 ? "var(--text-primary)" : "var(--bg-card)",
              padding: 16,
              minHeight: 150,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: index === layers.length - 1 ? "var(--paper)" : "var(--text-secondary)",
                marginBottom: 14,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <b
              style={{
                display: "block",
                color: index === layers.length - 1 ? "var(--paper)" : "var(--text-primary)",
                fontSize: 20,
                marginBottom: 8,
              }}
            >
              {name}
            </b>
            <code
              style={{
                color: index === layers.length - 1 ? "var(--peach-200)" : "var(--turquoise-ink)",
                fontSize: 12,
              }}
            >
              {path}
            </code>
            <p
              style={{
                margin: "10px 0 0",
                color: index === layers.length - 1 ? "var(--paper)" : "var(--text-secondary)",
                lineHeight: 1.45,
              }}
            >
              {note}
            </p>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

function ProductionLayersViz() {
  const layers = [
    ["Input guard", "moderation, chặn prompt injection, lọc PII", "var(--turquoise-500)"],
    ["Model", "LLM sinh câu trả lời hoặc tool call", "var(--graphite)"],
    ["Output guard", "kiểm nội dung, validate schema, đối chiếu nguồn", "var(--peach-500)"],
    ["Action guard", "gate tool, người duyệt cho thao tác rủi ro cao", "var(--clay)"],
  ];

  return (
    <ArticleViz caption="Defense in depth: input, model, output, action là các lớp riêng. Observability chạy dưới tất cả.">
      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            minWidth: 720,
            display: "grid",
            gridTemplateColumns: `repeat(${layers.length}, 1fr)`,
            gap: 12,
            alignItems: "stretch",
          }}
        >
          {layers.map(([title, note, color], index) => (
            <div
              key={title}
              style={{
                minHeight: 150,
                border: "1px solid var(--border)",
                borderTop: `5px solid ${color}`,
                borderRadius: 14,
                background: "var(--bg-card)",
                padding: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <b style={{ color: "var(--text-primary)", fontSize: 19 }}>{title}</b>
              <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          border: "1px solid var(--border)",
          borderRadius: 14,
          background: "var(--paper-2)",
          padding: 16,
          color: "var(--text-primary)",
        }}
      >
        <b>Observability chạy dưới mọi lớp:</b>{" "}
        <span style={{ color: "var(--text-secondary)" }}>
          log, trace, metric, eval suite trên case đã gán nhãn, và red team tìm
          lỗ hổng trước khi user gặp.
        </span>
      </div>
    </ArticleViz>
  );
}

function ChecklistViz() {
  const items = [
    ["Scope", "Hook bảo vệ asset nào, ở event nào?"],
    ["Matcher", "Narrow tool name trước, regex sau."],
    ["Parser", "Parse JSON bằng thư viện, không grep chuỗi thô."],
    ["Decision", "Deny có lý do rõ cho Claude hoặc user."],
    ["Audit", "Log đủ để review nhưng không lộ secret."],
    ["Test", "Có fixture cho command nguy hiểm và false positive."],
  ];

  return (
    <ArticleViz caption="Checklist này dùng để review hook như review production code.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 12,
        }}
      >
        {items.map(([title, note]) => (
          <div
            key={title}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr",
              gap: 12,
              alignItems: "start",
              border: "1px solid var(--border)",
              borderRadius: 14,
              background: "var(--bg-card)",
              padding: 16,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: "var(--turquoise-500)",
                color: "var(--paper)",
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            <div>
              <b style={{ color: "var(--text-primary)", fontSize: 18 }}>{title}</b>
              <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                {note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}

function CodePanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div
      style={{
        border: "1px solid var(--border-strong)",
        borderRadius: 14,
        background: "var(--text-primary)",
        color: "var(--paper)",
        padding: 16,
        overflow: "auto",
      }}
    >
      <div
        style={{
          color: "var(--peach-200)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <pre
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
        }}
      >
        {lines.join("\n")}
      </pre>
    </div>
  );
}

function DecisionCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  tone: "allow" | "deny" | "ask" | "neutral";
}) {
  const color =
    tone === "allow"
      ? "var(--turquoise-500)"
      : tone === "deny"
      ? "var(--clay)"
      : tone === "ask"
        ? "var(--peach-500)"
        : "var(--text-primary)";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: `5px solid ${color}`,
        borderRadius: 14,
        background: "var(--bg-card)",
        padding: 14,
      }}
    >
      <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>
        {title}
      </div>
      <b style={{ color: "var(--text-primary)", fontSize: 18 }}>{value}</b>
      <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", lineHeight: 1.45 }}>
        {note}
      </p>
    </div>
  );
}

function LaneCard({
  title,
  steps,
  accent,
}: {
  title: string;
  steps: string[];
  accent: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "var(--bg-card)",
        padding: 16,
      }}
    >
      <b style={{ color: "var(--text-primary)", fontSize: 20 }}>{title}</b>
      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                background: accent,
                color: "var(--paper)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {index + 1}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroCard({
  x,
  y,
  width = 154,
  height = 96,
  title,
  note,
  tone,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  title: string;
  note: string;
  tone: "dark" | "gate" | "tool" | "deny" | "log";
}) {
  const fill =
    tone === "dark"
      ? "var(--text-primary)"
      : tone === "gate"
        ? "var(--turquoise-50)"
        : tone === "deny"
          ? "var(--clay)"
          : tone === "log"
            ? "var(--paper-2)"
        : "var(--bg-card)";
  const text = tone === "dark" || tone === "deny" ? "var(--paper)" : "var(--text-primary)";
  const muted =
    tone === "dark" || tone === "deny"
      ? "var(--paper)"
      : tone === "gate"
        ? "var(--text-primary)"
        : "var(--text-secondary)";

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={width}
        height={height}
        rx="16"
        fill={fill}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <text
        x="18"
        y="38"
        fill={text}
        fontSize="20"
        fontWeight="800"
        fontFamily="var(--font-sans)"
      >
        {title}
      </text>
      <text x="18" y="63" fill={muted} fontSize="13" fontFamily="var(--font-sans)">
        {note}
      </text>
    </g>
  );
}

function HeroFlowLabel({
  x,
  y,
  text,
  tone = "default",
}: {
  x: number;
  y: number;
  text: string;
  tone?: "default" | "deny";
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={text.length * 9 + 24}
        height="24"
        rx="12"
        fill="var(--bg-card)"
        stroke={tone === "deny" ? "var(--clay)" : "var(--border)"}
      />
      <text
        x="12"
        y="16"
        fill={tone === "deny" ? "var(--clay)" : "var(--text-primary)"}
        fontSize="12"
        fontWeight="900"
        fontFamily="var(--font-mono)"
      >
        {text}
      </text>
    </g>
  );
}

function GridDots() {
  return (
    <g opacity="0.5">
      {Array.from({ length: 13 }).map((_, col) =>
        Array.from({ length: 5 }).map((__, row) => (
          <circle
            key={`${col}-${row}`}
            cx={70 + col * 62}
            cy={44 + row * 58}
            r="2"
            fill="var(--border)"
          />
        )),
      )}
    </g>
  );
}
