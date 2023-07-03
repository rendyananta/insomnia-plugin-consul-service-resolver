const serviceTypeHTTP = "http"
const serviceTypeHTTPS = "https"
const serviceTypeGRPC = "grpc"
const serviceTypeWebSocket = "ws"

module.exports.templateTags = [{
    name: 'consulServiceResolver',
    displayName: 'Consul Service Resolver',
    liveDisplayName: function(args) {
        return "Consul: " + buildURL(args[1].value, args[2].value, args[3].value)
    },
    description: 'Helper to resolve consul service IP.',
    args: [
        {
            displayName: 'Consul Server',
            description: 'Consul server address',
            type: 'string',
        },
        {
            displayName: 'Protocol ',
            description: 'Service protocol type (HTTP/GRPC/Websocket)',
            type: 'enum',
            defaultValue: serviceTypeHTTP,
            options: [
                {
                    displayName: 'HTTP',
                    value: serviceTypeHTTP
                },
                {
                    displayName: 'HTTPS',
                    value: serviceTypeHTTPS
                },
                {
                    displayName: 'gRPC',
                    value: serviceTypeGRPC
                },
                {
                    displayName: 'WebSocket',
                    value: serviceTypeWebSocket
                },
            ]
        }, 
        {
            displayName: 'Service Name',
            description: 'service name',
            type: 'string'
        },
        {
            displayName: 'Port',
            description: 'Service port',
            type: 'number',
            defaultValue: 80
        },
        {
            displayName: 'Override',
            description: 'If this is not empty, the server URL will use this value instead.',
            type: 'string',
            defaultValue: ''
        }
    ],
    async run (ctx, consulServer, protocol, service, port, override) {
        const useServerIP = async function() {
            const ip = await getIP(ctx, consulServer, service)
            return buildURL(protocol, ip, port)
        }

        if (override) {
            console.log(override)
        }

        return override ? override : useServerIP()
    }
}];

function buildURL(protocol, service, port) {
    if (protocol == serviceTypeHTTP && port == 80) {
        return protocol + "://" + service
    }

    if (protocol == serviceTypeHTTPS && port == 443) {
        return protocol + "://" + service
    }

    return protocol + "://" + service + ":" + port
}

async function getIP(context, consulServer, serviceName) {
    const response = await fetch(`https://${consulServer}/v1/health/service/${serviceName}?passing=true`)

    const items = await response.json()

    if (items.size < 1) {
        throw new Error(`no ${serviceName} service healthy`)
    }

    return items[0].Service.Address
}