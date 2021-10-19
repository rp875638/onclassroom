const mediasoup = require("mediasoup");
const fs = require('fs');

exports.mediasoups = function(mediasoup){
    mediasoup.observer.on("newworker", (worker) =>
{
    log(`new worker created [worker.pid: ${worker.pid}]`)

  worker.observer.on("close", () => 
  {
      log(`worker closed [worker.pid: ${worker.pid}]`)
  });

  worker.observer.on("newrouter", (router) =>
  {
      log(`new router created [worker.pid:${worker.pid}, router.id:${router.id}]`)

    router.observer.on("close", () => 
    {
        log(`router closed [router.id:${router.id}]`);
    });

    router.observer.on("newtransport", (transport) =>
    {
        log(`new transport created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}]`)

      transport.observer.on("close", () => 
      {
          log(`transport closed [transport.id:${transport.id}]`)
      });

      transport.observer.on("newproducer", (producer) =>
      {
          log(`new producer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, producer.id:${producer.id}]`)

        producer.observer.on("close", () => 
        {
          log(`producer closed [producer.id:${producer.id}]`);
        });
      });

      transport.observer.on("newconsumer", (consumer) =>
      {
          log(`new consumer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, consumer.id:${consumer.id}]`)

        consumer.observer.on("close", () => 
        {
            log(`consumer closed [consumer.id:${consumer.id}]`)
        });
      });

      transport.observer.on("newdataproducer", (dataProducer) =>
      {
          log(`new data producer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, dataProducer.id:${dataProducer.id}]`)

        dataProducer.observer.on("close", () => 
        {
            log(`data producer closed [dataProducer.id:${dataProducer.id}]`);
          console.warn("", dataProducer.id);
        });
      });

      transport.observer.on("newdataconsumer", (dataConsumer) =>
      {log(`new data consumer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, dataConsumer.id:${dataConsumer.id}]`);
        console.warn(
          "",
          worker.pid, router.id, transport.id, dataConsumer.id);

        dataConsumer.observer.on("close", () => 
        {
            log(`data consumer closed [dataConsumer.id:${dataConsumer.id}]`)
          console.warn("", dataConsumer.id);
        });
      });
    });
  });
});
}

function log(data){
    data = data + "\n"
    fs.writeFile('log.txt', data,{ flag: 'a+' }, err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
}
