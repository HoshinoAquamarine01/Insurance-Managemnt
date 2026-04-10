import Icon from "./Icon";

const badgeClass = {
  green: "badge-green",
  orange: "badge-orange",
  violet: "badge-violet",
  red: "badge-red",
};

export default function ContractCard({ contract, actions = true }) {
  return (
    <article className="contract-card soft-card">
      <div className="contract-card__top">
        <div className="contract-chip">
          <div className="contract-chip__icon">
            <Icon
              name={
                contract.variant === "violet"
                  ? "calculator"
                  : contract.variant === "orange"
                    ? "eye"
                    : "document"
              }
              size={18}
            />
          </div>
          <div>
            <h3>{contract.code}</h3>
            <p>{contract.title}</p>
          </div>
        </div>

        <span
          className={`status-pill ${badgeClass[contract.variant] || "badge-green"}`}
        >
          {contract.status}
        </span>
      </div>

      <div className="contract-grid">
        <div className="info-block">
          <span className="info-label">Người được bảo hiểm</span>
          <strong>{contract.insured}</strong>
        </div>
        <div className="info-block">
          <span className="info-label">Người lập hợp đồng</span>
          <strong>{contract.creator}</strong>
        </div>
        <div className="info-block">
          <span className="info-label">Thời hạn</span>
          <strong>{contract.term}</strong>
        </div>
        <div className="info-block">
          <span className="info-label">Giá trị bảo hiểm</span>
          <strong>{contract.value}</strong>
        </div>
      </div>

      {actions && (
        <div className="contract-actions">
          <button className="action-button">
            <Icon name="arrow" size={16} />
            Xem
          </button>
          <button className="action-button">
            <Icon name="edit" size={16} />
            Sửa
          </button>
          <button className="action-button danger">
            <Icon name="close" size={16} />
            Xóa
          </button>
        </div>
      )}
    </article>
  );
}
