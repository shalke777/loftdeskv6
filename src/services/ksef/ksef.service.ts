export const ksefService = {
  async sendInvoice(invoiceId: string) {
    return { invoiceId, status: 'queued' }
  },
}
