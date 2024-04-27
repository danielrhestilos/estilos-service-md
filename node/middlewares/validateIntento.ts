import { json } from 'co-body'
export async function validateIntentoProps(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const body = await json(ctx.req)
  const {
    // req:{}
    // vtex:{},
    clients: {masterdata},

  } = ctx

  // console.log('vtex: ');
  // console.log(vtex);
  // const body={}


  
  const doc = await  masterdata.createDocument({
    dataEntity:"CI",
    fields: body,
    
  })
  // console.log('body ',JSON.stringify(body));
  
  if (!doc) {
    ctx.status = 404

    return
  }


  ctx.status = 200
  ctx.body = {
    result: "ok"
  }
  ctx.set('Cache-Control', 'no-cache')

  await next()
}
