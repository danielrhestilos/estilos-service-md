import { json } from 'co-body'

export async function validateRegistrosProps(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const body = await json(ctx.req)
  const {
    clients: {masterdata},
  } = ctx

  let algunCorrecto = null 
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formatDateYesterday = yesterday.toISOString().slice(0, 10);
  const docs = await masterdata.searchDocumentsWithPaginationInfo(
    {
      dataEntity:'CI',
      fields:["fecha","hora","resultado","numero"],
      pagination: {page:1,pageSize:10},
    //   where : `(numero=${body.numero}) AND (fecha between ${formatDateYesterday}T${body.hora} AND ${body.fecha})`
      where : `(numero=${body.numero}) AND (fecha between ${formatDateYesterday} AND ${body.fecha})`
    //   where : `(numero=${body.numero}) `
    })

    if (!docs) {
        ctx.status = 404
        return
    }
    else {
        algunCorrecto  = docs.data.some((registro:any) => registro.resultado == true)
    }

    ctx.status = 200

    if(algunCorrecto) {
        ctx.body = {
        attempts: 0,
        ok: true,
        msg: "Puedes intentar de nuevo."  ,
        docs
    }}
    
    else {
        ctx.body = {
            attempts: docs.data.length,
            formatDateYesterday,
            docs,
            ok: docs.data.length <3 ,
            msg: docs.data.length >=3 ?". Por motivos de seguridad, hemos suspendido temporalmente el uso de la tarjeta por un período de 24 horas. Por favor, no dudes en contactarnos al  para obtener asistencia adicional" :"Recuerda que tienes 3 intentos para ingresar tu clave"
        } 
    }
    
    ctx.set('Cache-Control', 'no-cache')
    await next()
}
