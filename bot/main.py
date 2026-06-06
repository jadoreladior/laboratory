import asyncio
import logging
import os
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv
from handlers import start, admin

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
PORT = int(os.getenv("PORT", "8080"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


async def handle_health(reader, writer):
    await reader.read(1024)
    writer.write(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok")
    await writer.drain()
    writer.close()


async def main():
    # Health server — required for Render web_service
    server = await asyncio.start_server(handle_health, "0.0.0.0", PORT)
    logging.info(f"Health server on port {PORT}")

    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=MemoryStorage())

    dp.include_router(start.router)
    dp.include_router(admin.router)

    logging.info("🎛 Лаборатория CRM бот запущен")

    async with server:
        await dp.start_polling(bot, skip_updates=True)


if __name__ == "__main__":
    asyncio.run(main())
