import { json } from 'co-body'
export async function validateIntentoProps(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const body = await json(ctx.req)
  const {
    clients: {masterdata},
  } = ctx

  const formatDate  =  new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formatDateYesterday = yesterday.toISOString().slice(0, 10);
  const docs = await masterdata.searchDocumentsWithPaginationInfo(
    {
      dataEntity:'CI',
      fields:["fecha","hora","resultado","numero"],
      pagination: {page:1,pageSize:3},
      where : `(numero=${body.numero} AND resultado=false) AND (fecha between ${formatDateYesterday}T${body.hora} AND ${body.fecha})`
    })

  const doc = await  masterdata.createDocument({
    dataEntity:"CI",
    fields: body,
  })

  if (!doc) {
    ctx.status = 404
    return
  }

  ctx.status = 200
  ctx.body = {
    result: "ok",
    docs: docs,
    body,
    formatDate
  }
  ctx.set('Cache-Control', 'no-cache')
  await next()
}