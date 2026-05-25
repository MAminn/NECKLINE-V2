const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    targetType: { type: String, required: true },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    diff: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
    requestId: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: false,
  }
);

auditEventSchema.pre('updateOne', function () {
  throw new Error('AuditEvent is append-only; updates are prohibited');
});
auditEventSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditEvent is append-only; updates are prohibited');
});
auditEventSchema.pre('deleteOne', function () {
  throw new Error('AuditEvent is append-only; deletes are prohibited');
});
auditEventSchema.pre('deleteMany', function () {
  throw new Error('AuditEvent is append-only; deletes are prohibited');
});

auditEventSchema.index({ target: 1, targetType: 1, timestamp: -1 });
auditEventSchema.index({ actor: 1, timestamp: -1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
