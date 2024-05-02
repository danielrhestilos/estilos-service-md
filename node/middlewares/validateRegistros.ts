import { json } from 'co-body'

export async function validateRegistrosProps(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const body = await json(ctx.req)
  const {
    clients: {masterdata},
  } = ctx
  let registrosUltimas24Horas=[]
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

    if (!docs) {
        ctx.status = 404
        return
    }
    else {
        registrosUltimas24Horas = docs.data.filter((registro:any) => {
            const fechaRegistro = new Date(`${registro.fecha.split('T')[0]}T${registro.hora}`);
            return fechaRegistro >= yesterday;
        });
    }

    ctx.status = 200
    ctx.body = {
        attempts: registrosUltimas24Horas.length,
        ok: registrosUltimas24Horas.length ==3 ,
        msg: registrosUltimas24Horas.length ==3 ?"Vuelve a intentar en 24 horas" :"Ok"
    } 
    
    ctx.set('Cache-Control', 'no-cache')
    await next()
}
